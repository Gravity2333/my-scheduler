# my-sample-scheduler 说明文档

## 概述

`my-sample-scheduler` 是一个 JavaScript 调度器，旨在优化任务执行的顺序和优先级。通过模拟浏览器的任务调度系统，`my-scheduler` 允许开发者按照优先级调度任务，并管理定时任务的执行。它支持多种任务优先级，并根据不同任务的优先级和时间延迟来控制任务的调度。

该调度器支持：

- 任务的优先级调度
- 延迟任务的处理
- 基于时间片的任务执行
- 基于 `MessageChannel` 和 `setTimeout` 的异步任务调度

## 特性

- **优先级队列**：任务可以按照不同优先级调度执行。
- **延迟任务处理**：可以设置延迟任务，确保任务在指定时间后执行。
- **时间切片调度**：每个任务被限制在一个时间切片（默认 5ms）内执行。
- **平滑过渡**：对于大任务，可以通过回调函数的嵌套执行，确保页面不会被卡住。
- **自动调度**：当有新的任务加入时，调度器会自动启动任务循环，并在有任务时持续运行。

## 安装

```bash
npm install my-sample-scheduler
```

## 使用
my-sample-scheduler 使用单例模式，请直接导入scheduler调度器
```javascript
import scheduler from "my-sample-scheduler";

// 简单的任务调度
scheduler.scheduleCallback(
  PriorityLevel.NORMAL_PRIORITY,
  (didUserCallbackTimeout) => {
    console.log("任务开始执行", didUserCallbackTimeout);
    return; // 任务执行完毕
  }
);

// 延迟任务调度
scheduler.scheduleCallback(
  PriorityLevel.LOW_PRIORITY,
  (didUserCallbackTimeout) => {
    console.log('低优先级任务执行', didUserCallbackTimeout);
    return; // 任务执行完毕
  },
  1000 // 延迟1秒
);

```

### 任务优先级
调度器支持以下几种任务优先级，您可以根据任务的紧急程度选择合适的优先级：

- **IMMEDIATE_PRIORITY**：立即执行的任务，具有最高优先级。适用于需要立即执行的任务。
- **USER_BLOCKING_PRIORITY**：用户阻塞任务，适用于需要交互的任务。
- **NORMAL_PRIORITY**：普通任务，默认优先级。
- **LOW_PRIORITY**：低优先级任务，适用于不急需执行的任务。
- **IDLE_PRIORITY**：空闲任务，只有在没有其他任务时才会执行。
