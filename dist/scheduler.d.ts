/** 调度优先级 */
export declare enum PriorityLevel {
    /** 立即执行优先级 优先级最高 */
    "IMMEDIATE_PRIORITY" = "IMMEDIATE_PRIORITY",
    /** 用户阻塞优先级 此之 */
    "USER_BLOCKING_PRIORITY" = "USER_BLOCKING_PRIORITY",
    /** 正常默认优先级  */
    "NORMAL_PRIORITY" = "NORMAL_PRIORITY",
    /** 低优先级 */
    "LOW_PRIORITY" = "LOW_PRIORITY",
    /** IDLE 优先级 优先级最低 等待时间无限长 */
    "IDLE_PRIORITY" = "IDLE_PRIORITY"
}
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
    scheduleCallback: (priorityLevel: PriorityLevel, callback: UserCallback, delay?: number) => void;
}
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
declare class Scheduler implements SchedulerInterface {
    /** 声明任务队列 */
    private taskQueue;
    /** 声明延迟队列 */
    private timerQueue;
    /** 任务计数器 */
    private userTaskCnt;
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
    private isMessageLoopRunning;
    /**
     * HostCallbackScheduled
     * 给HostCallback被调度这个过程上锁，也就是一个时刻只能有一个HostCallback被调度
     * 注意，Scheduler的MessageLoop不会一直空转，只有当taskQueue有任务的时候，才会启动循环
     * scheduler没有一直监测taskQueue是否为空，而是通过，
     *  1. 如果有普通任务被注册，就开启循环，执行完关闭
     *  2. 如果有延迟任务到达延迟时间被放倒taskQueue 就开启循环
     * HostCallbackScheduled 需要保证，一次只能有一个“触发loop过程” 如果同时有大量任务被注册，每次注册都会触发一次loop 会造成资源浪费
     */
    private isHostCallbackScheduled;
    /** 给perform加锁
     *  同一时刻只能有一个workLoop运行，对其进行加锁
     */
    private isPerformingWork;
    /** hostTimeoutScheduled 定时任务加锁，一次只能有一个定时任务运行 */
    private isHostTimeoutScheduled;
    /** 计时器id 用来清理定时器 */
    private timerId;
    /** 全局任务开始时间 */
    private startTime;
    /** 当前执行的优先级 */
    private currentPriorityLevel;
    /** 注册回调任务 */
    scheduleCallback(priorityLevel?: PriorityLevel, callback?: UserCallback, delay?: number): UserCallbackTask;
    /** 取消任务 */
    cancelCallback(task: UserCallbackTask): void;
    /** 开启任务循环 */
    private requestHostCallback;
    /** 这个函数的作用是，检查延迟队列，如果有已经完成延迟的 则加入任务队列 */
    private advanceTimers;
    /** 处理完成延迟
     * 1. 解锁
     * 2. 查看messageloop是否在运行，如果没有运行则触发
     */
    private handleTimeout;
    /** 对settimeout的包装，并且保存timerId */
    private requestHostTimeout;
    /** 取消定时任务 */
    private cancelHostTimeout;
    /** 持续循环运行任务
     * 开启一个时间切片的任务，时间切片的宽度为frameYieldMs 默认5ms
     * 每次时间切片运行结束后，如果还有任务，重复调用performWorkUntilDeadline继续运行
     * 没有任务了，则释放isMessageLoopRunning锁，循环停止运行
     */
    private performWorkUntilDeadline;
    /** 调度任务 使用messageChannel
     *  messageChannel的好处是
     *  1. 可以创建宏任务 不阻塞主线程
     *  2. 相比于settimeout 延迟更小
     *  3. 在没有messageChannel的情况下，使用settimeout兜底
     */
    private schedulePerformWorkUntilDeadline;
    /**
     * flushWork 运行任务 一个5ms的时间 并且返回是否还有任务
     * @param workStartTime
     * @returns
     */
    private flushWork;
    /**
     * workLoop
     * @param workStartTime
     */
    private workLoop;
    /** 是否应当让出主线程 */
    shouldYieldToHost(): boolean;
    /** 获取当前的优先级 */
    getCurrentPriorityLevel(): PriorityLevel;
    /** 以某优先级同步运行 */
    runWithPriority(priorityLevel: PriorityLevel, callback: any): void;
}
declare const scheduler: Scheduler;
export default scheduler;
