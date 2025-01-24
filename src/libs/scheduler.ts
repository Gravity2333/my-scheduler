import { MiniHeap } from "./mini-heap";

/** 比较函数 */
const compare = (a: UserCallbackTask, b: UserCallbackTask) => {
  const diff = a.expirationTime - b.expirationTime;
  return diff !== 0 ? diff : a.id - b.id;
};

/** 调度优先级 */
export enum PriorityLevel {
  /** 立即执行优先级 优先级最高 */
  "IMMEDIATE_PRIORITY" = "IMMEDIATE_PRIORITY",
  /** 用户阻塞优先级 此之 */
  "USER_BLOCKING_PRIORITY" = "USER_BLOCKING_PRIORITY",
  /** 正常默认优先级  */
  "NORMAL_PRIORITY" = "NORMAL_PRIORITY",
  /** 低优先级 */
  "LOW_PRIORITY" = "LOW_PRIORITY",
  /** IDLE 优先级 优先级最低 等待时间无限长 */
  "IDLE_PRIORITY" = "IDLE_PRIORITY",
}

/** 优先级到超时时间的映射  */
const PRIORITY_LEVEL_TO_TIMEOUT_MAP: Record<`${PriorityLevel}`, number> = {
  [PriorityLevel.IMMEDIATE_PRIORITY]: -1,
  [PriorityLevel.USER_BLOCKING_PRIORITY]: 250,
  [PriorityLevel.NORMAL_PRIORITY]: 500,
  [PriorityLevel.LOW_PRIORITY]: 1000,
  [PriorityLevel.IDLE_PRIORITY]: Number.MAX_SAFE_INTEGER,
};

/** 接受参数didUserCallbackTimeout 表示当前是否已经超时,返回值可以是函数(更小的任务) 或者 undefined */
export type UserCallback = (didUserCallbackTimeout: boolean) => any;

interface SchedulerInterface {
  /**
   * 注册回调
   * @param priority 用户回调函数优先级
   * @param callback 用户回调函数
   * @param delay 可选，配置延迟任务 单位毫秒
   * @returns
   */
  scheduleCallback: (
    priorityLevel: PriorityLevel,
    callback: UserCallback,
    delay?: number
  ) => void;
}

/** 每个任务的最长时间 默认5ms */
const frameYieldMs = 5;

/** 用户任务
 *  Callback 会被封装成Task
 */
type UserCallbackTask = {
  /** id由taskCounter维护 确定任务的先后顺序，当sortIndex相同时，根据先后顺序比较 */
  id: number;
  priorityLevel: PriorityLevel;
  callback: UserCallback | null;
  startTime: number;
  expirationTime: number;
  /** 优先级队列根据这个sortIndex维护顺序
   * 在非延迟的情况下 sortIndex就是过期时间
   * 在延迟的情况下 sortIndex为startTime 即延迟结束advanced到taskQueue到时间
   */
  sortIndex: number;
};

/** 导出一个Scheduler 调度器 */
class Scheduler implements SchedulerInterface {
  /** 声明任务队列 */
  private taskQueue: MiniHeap<UserCallbackTask> = new MiniHeap(compare);
  /** 声明延迟队列 */
  private timerQueue: MiniHeap<UserCallbackTask> = new MiniHeap(compare);
  /** 任务计数器 */
  private userTaskCnt = 0;
  /** 锁属性 */
  /** 时间轴
   *  messageLoop
   * ｜______________________________MessageLoop__________________________________|
   *  hostCallbackScheduled
   * |____hostCa..duled__|
   *  performWork
   *                     |__performWork__|    |__performWork__|   |__performWork__|
   *
   *
   */

  /**
   * MessageLoop锁
   * 本锁表示WorkLoop正在运行， 只要taskQueue中有任务 loop就会持续运行
   * 增加这个锁 为了防止loop被重复开启
   */
  private isMessageLoopRunning: boolean = false;

  /**
   * HostCallbackScheduled
   * 给HostCallback被调度这个过程上锁，也就是一个时刻只能有一个HostCallback被调度
   * 注意，Scheduler的MessageLoop不会一直空转，只有当taskQueue有任务的时候，才会启动循环
   * scheduler没有一直监测taskQueue是否为空，而是通过，
   *  1. 如果有普通任务被注册，就开启循环，执行完关闭
   *  2. 如果有延迟任务到达延迟时间被放倒taskQueue 就开启循环
   * HostCallbackScheduled 需要保证，一次只能有一个“触发loop过程” 如果同时有大量任务被注册，每次注册都会触发一次loop 会造成资源浪费
   */
  private isHostCallbackScheduled: boolean = false;

  /** 给perform加锁
   *  同一时刻只能有一个workLoop运行，对其进行加锁
   */
  private isPerformingWork: boolean = false;

  /** hostTimeoutScheduled 定时任务加锁，一次只能有一个定时任务运行 */
  private isHostTimeoutScheduled: boolean = false;

  /** 计时器id 用来清理定时器 */
  private timerId: any = void 0;

  /** 全局任务开始时间 */
  private startTime = -1;

  /** 当前执行的优先级 */
  private currentPriorityLevel: PriorityLevel = PriorityLevel.NORMAL_PRIORITY;

  /** 注册回调任务 */
  public scheduleCallback(
    priorityLevel: PriorityLevel = PriorityLevel.NORMAL_PRIORITY,
    callback: UserCallback = () => {},
    delay = 0
  ) {
    /** 获取当前高精度时间 */
    const currentTime = performance.now();
    /** 任务开始时间
     *  如果非延迟 就是currentTime
     *  如果配置了delay 则startTime = currentTime + delay
     */
    const startTime = currentTime + delay;

    /** 根据优先级，计算timeout
     *  默认为NORMAL 即 500
     */
    const timeout =
      PRIORITY_LEVEL_TO_TIMEOUT_MAP[priorityLevel] ||
      PRIORITY_LEVEL_TO_TIMEOUT_MAP[PriorityLevel.NORMAL_PRIORITY];

    /** 过期时间
     *  对于普通任务 currentTime + timeout
     *  对于延迟任务 currentTime + delay + timeout
     */
    const expirationTime = startTime + timeout;

    /** 把callback封装成UserCallbackTask  */
    const userCallbackTask: UserCallbackTask = {
      id: this.userTaskCnt++,
      priorityLevel,
      startTime,
      expirationTime,
      callback,
      sortIndex: -1,
    };

    if (startTime > currentTime) {
      /** 如果是延迟任务, 用startTime来用作sortIndex排序调度 当达到开始时间后，转移到taskQueue */
      userCallbackTask.sortIndex = startTime;
      /** 加入延迟队列 */
      this.timerQueue.push(userCallbackTask);
      // 看一下当前最新的timertask是不是当前task，如果不是不用管 此时要么有运行中的定时器，要么messageLoop在运行
      if (this.timerQueue.peek() === userCallbackTask) {
        // 如果当前有timer 取消
        this.cancelHostTimeout();
        this.requestHostTimeout(
          this.handleTimeout,
          userCallbackTask.startTime - performance.now()
        );
      }
    } else {
      /** 如果是普通任务 普通任务使用expirationTime 作为sortIndex调度 */
      userCallbackTask.sortIndex = expirationTime;
      /** 加入taskQueue */
      this.taskQueue.push(userCallbackTask);
      // 没有loop触发事件在运行时 触发loop
      if (!this.isHostCallbackScheduled && !this.isPerformingWork) {
        this.isHostCallbackScheduled = true; // 上锁
        this.requestHostCallback();
      }
    }

    return userCallbackTask;
  }

  /** 取消任务 */
  public cancelCallback(task: UserCallbackTask) {
    task.callback = null;
  }

  /** 开启任务循环 */
  private requestHostCallback() {
    /** 在这里开启循环，并且上锁，保证只有一个performWorkUntilDeadline在运行 */
    if (!this.isMessageLoopRunning) {
      this.isMessageLoopRunning = true;
      this.schedulePerformWorkUntilDeadline();
    }
  }

  private advacneTimers() {}

  /** 处理完成延迟
   * 1. 解锁
   * 2. 查看messageloop是否在运行，如果没有运行则触发
   */
  private handleTimeout() {
    // 解锁
    this.isHostTimeoutScheduled = false;
    this.advacneTimers();

    // 检查taskQueue
    if (!this.isHostTimeoutScheduled) {
      // 这里isPerformingWork一定是false 因为在执行任务的时候 会把timer都取消掉
      const task = this.taskQueue.peek();
      if (task) {
        // 开始调度触发循环
        this.isHostTimeoutScheduled = true;
        this.requestHostCallback();
      } else {
        // 如果没有触发循环，则需要再次检查timerQueue 还有没有任务
        const peekTimer = this.timerQueue.peek();
        if (peekTimer) {
          this.requestHostTimeout(
            this.handleTimeout,
            peekTimer.startTime - performance.now()
          );
        }
      }
    }
  }

  /** 对settimeout的包装，并且保存timerId */
  private requestHostTimeout(handler: any, delay: number) {
    // 加锁
    if (!this.isHostTimeoutScheduled) {
      this.isHostTimeoutScheduled = true;
      this.timerId = setTimeout(handler, delay);
    }
  }

  /** 取消定时任务 */
  private cancelHostTimeout() {
    if (this.isHostTimeoutScheduled) {
      clearTimeout(this.timerId);
      this.timerId = void 0;
      // 解锁
      this.isHostTimeoutScheduled = false;
    }
  }

  /** 持续循环运行任务
   * 开启一个时间切片的任务，时间切片的宽度为frameYieldMs 默认5ms
   * 每次时间切片运行结束后，如果还有任务，重复调用performWorkUntilDeadline继续运行
   * 没有任务了，则释放isMessageLoopRunning锁，循环停止运行
   */
  private performWorkUntilDeadline() {
    if (this.isMessageLoopRunning) {
      /** 获得每次循环的开始时间 */
      const workStartTime = performance.now();
      this.startTime = workStartTime;
      /**
       * 解释一下，这里为什么用try..finally
       * try中调用flushWork 执行任务，每次执行任务时，会从taskQueue中peek一个任务运行
       * peek出来之后，会先把task.callback保存到一个临时变量callback中，并且给 task.callback 赋 null
       * 判断这个临时的callback 如果是function 则运行，运行之后如果还有没运行完的任务 再给task.callback = remainingTaskFunc
       * 如果callback 不存在 或者不是函数 不可运行 则直接弹出这个任务
       *
       * 如果callback执行内部报错，那么此时 task.callback = null 并且跳出flushWork 这里的做法是，如果有错误则忽略掉，通过finally继续开启下一个performWorkUntilDeadline
       * 当下一个performWorkUntilDeadline开启后，由于task.callback = null 会直接pop出taskQueue 做到了忽略错误继续运行loop
       */
      let hasMorkWork = true;
      try {
        hasMorkWork = this.flushWork(workStartTime);
      } finally {
        if (hasMorkWork) {
          /** 还有任务 继续运行 */
          this.schedulePerformWorkUntilDeadline();
        } else {
          /** 没有任务了 关闭loop */
          this.isMessageLoopRunning = false;
        }
      }
    }
  }

  /** 调度任务 使用messageChannel
   *  messageChannel的好处是
   *  1. 可以创建宏任务 不阻塞主线程
   *  2. 相比于settimeout 延迟更小
   *  3. 在没有messageChannel的情况下，使用settimeout兜底
   */
  private schedulePerformWorkUntilDeadline() {
    if (typeof MessageChannel === "function") {
      const messageChannel = new MessageChannel();
      messageChannel.port2.onmessage = this.performWorkUntilDeadline.bind(this);
      /** 发送消息 */
      messageChannel.port1.postMessage(null);
    } else {
      /* 没有MessageChannel 用settimeout兜底*/
      setTimeout(() => {
        this.performWorkUntilDeadline();
      });
    }
  }

  /**
   * flushWork 运行任务 一个5ms的时间 并且返回是否还有任务
   * @param workStartTime
   * @returns
   */
  private flushWork(workStartTime: number): boolean {
    /** flushWork 的作用是
     * 1. 调用workloop 并且保证workloop是临界资源，对其加锁
     * 2. 如果有延迟任务在运行，则取消掉，因为延迟任务没意义了
     * （延迟任务就是为了在延迟到达的时候把任务放到taskQueue 并且开启loop 在当前任务执行完之前 延迟任务即使到达了 也只能等着，在每次workLoop的小循环运行结束和workLoop运行结束 都会advaned）
     * 3.任务开始了 代表 hostCallbackSchedule的调度过程（loop触发过程）已经结束 释放锁
     * 4. 使用try..finally 忽略错误，在finally中释放isPerformWork
     *
     */
    this.isHostCallbackScheduled = false;
    // 定时任务没必要和messageLoop一起运行，这里取消掉定时器
    this.cancelHostTimeout();

    // 加锁
    this.isPerformingWork = true;
    const previousPriorityLeve = this.currentPriorityLevel;
    try {
      return this.workLoop(workStartTime);
    } finally {
      /** 注意 这里finally一定会在最后执行 即便上面有return （return只是标记了返回点） */
      this.isPerformingWork = false;
      /** 恢复优先级 */
      this.currentPriorityLevel = previousPriorityLeve;
    }
  }

  /**
   * workLoop
   * @param workStartTime
   */
  private workLoop(workStartTime: number): boolean {
    /** workloop是个临界资源
     *  其功能是，在一个时间片内 （5ms）持续运行任务，直到时间片耗完
     *  注意，为什么要设计一个固定时间5ms 很多任务是很小的，可能其运行时间很短，如果一个workLoop只运行一个任务，很可能造成浪费
     *  进入workLoop之前会做很多准备 比如加锁 计算时间等 如果只为了运行一个小人物 很浪费资源，所以这里设计成了 一个时间片就是5ms
     *  如果运行完一个任务还有时间 就继续运行 直到5ms
     */
    // 当前时间
    let workCurrentTime = workStartTime;
    // 先检查一下有没有延迟任务需要加入到taskQueue
    this.advacneTimers();
    // 取得优先级最高的任务
    let currentTask = this.taskQueue.peek();

    /** 开始循环，每次循环都取新的currentTask
     * 有几种情况会停止循环
     * 1. 当前过期时间最小的任务还没过期 同时时间片结束 跳出循环，释放主线程
     * 2. 如果已经过期，并且时间片也结束，会继续运行，交给用户决定要不要继续运行，如果继续运行则用户会在callback中继续执行逻辑，带来的可能是页面卡顿
     *    如果用户不继续执行了，返回一个新的callback function 来处理剩下的任务即可
     * 3. workloop 对于小任务 会在一次执行过程（时间片5ms）内 执行多个，但是对于大任务，只会执行一个部分
     * 4. 如果定义大任务，如果用户的callback返回了一个函数 代表此任务为大任务 还有剩余任务，此时即便时间片还没用完 也要结束workLoop 释放主线程，下一个loop在执行
     */

    let isUserCallbackTimeout = false;
    while (currentTask) {
      // 更新判断是否超时
      isUserCallbackTimeout = currentTask.expirationTime < workCurrentTime;

      if (!isUserCallbackTimeout && this.shouldYieldToHost()) {
        // 让出主线程
        break;
      }

      /** 还有时间 执行callback */
      const callback = currentTask.callback;

      if (typeof callback === "function") {
        // callback置空
        currentTask.callback = null;
        // 更新优先级
        this.currentPriorityLevel = currentTask.priorityLevel;
        // 保证callback可调用
        const continuationCallback = callback(isUserCallbackTimeout);
        if (typeof continuationCallback === "function") {
          // 如果返回了剩余任务，表示当前执行的是大任务，重新给task的callback赋值，结束workloop
          currentTask.callback = continuationCallback;
          // 看一下是否有可以加入到taskQueue的延迟任务
          this.advacneTimers();
          // 表示还有任务
          return true;
        } else {
          // 当前任务执行完了，小任务，继续while执行
          if (currentTask === this.taskQueue.peek()) {
            this.taskQueue.pop(); // 弹出当前执行完的任务
          }
          // 看一下是否有可以加入到taskQueue的延迟任务
          this.advacneTimers();
        }
      } else {
        // 如果callback为空 或者不是函数，说明当前任务不可执行 也可能是当前任务已经报错了，直接弹出
        this.taskQueue.pop();
      }

      // 此时 继续循环执行小任务 取下一个任务
      currentTask = this.taskQueue.peek();
    }

    // 执行到这里，1.可能是是currentTask没超时，但是没有时间片了，推出workLoop，返回true表示还是任务 2.可能是没任务了
    if (currentTask) {
      return true;
    } else {
      // taskQueue没有任务了，此时返回false，此时flushwork结束，messageLoop结束，需要开启延迟任务，以确保在延迟到达时，能启动messageLoop
      const timerTask = this.timerQueue.peek();
      if (timerTask) {
        // 检查timerQueue 有任务则开启
        const firstTimer = this.timerQueue.peek();
        if (firstTimer) {
          this.requestHostTimeout(
            this.handleTimeout,
            firstTimer.startTime - performance.now()
          );
        }
      }
      return false;
    }
  }

  /** 是否应当让出主线程 */
  public shouldYieldToHost(): boolean {
    const timeElapsed = performance.now() - this.startTime;
    if (timeElapsed < frameYieldMs) {
      // The main thread has only been blocked for a really short amount of time;
      // smaller than a single frame. Don't yield yet.
      return false;
    }
    // Yield now.
    return true;
  }

  /** 获取当前的优先级 */
  getCurrentPriorityLevel() {
    return this.currentPriorityLevel;
  }
}

const scheduler = new Scheduler();
export default scheduler;
