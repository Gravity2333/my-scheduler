import scheduler, { PriorityLevel } from "./libs/scheduler";
import BigLineChart from "@/Pages/BigLineChart";
import { Modal, useModal } from "./components/Modal";
import Ball from "./Pages/Ball";

function App() {
  const { open } = useModal();

  return (
    <>
      <button
        onClick={() => {
          scheduler.scheduleCallback(
            PriorityLevel.USER_BLOCKING_PRIORITY,
            () => {
              open(
                `点击触发事件`,
                `当前事件触发优先级${PriorityLevel.USER_BLOCKING_PRIORITY}`
              );
              console.log(scheduler);
            }
          );
        }}
      >
        点击触发USER_BLOCK事件
      </button>

      <button
        onClick={() => {
          scheduler.scheduleCallback(PriorityLevel.IMMEDIATE_PRIORITY, () => {
            open(
              `点击触发事件`,
              `当前事件触发优先级${PriorityLevel.IMMEDIATE_PRIORITY}`
            );
          });
        }}
      >
        点击触发IMMEDIATE_PRIORIT事件
      </button>

      <button
        onClick={() => {
          scheduler.scheduleCallback(PriorityLevel.IDLE_PRIORITY, () => {
            open(
              `点击触发事件`,
              `当前事件触发优先级${PriorityLevel.USER_BLOCKING_PRIORITY}`
            );
          });
        }}
      >
        点击触发IDLE事件
      </button>

      <BigLineChart />
      <Ball />
      <Modal />
    </>
  );
}

export default App;
