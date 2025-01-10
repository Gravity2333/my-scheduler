import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import styles from "./index.less"; // 引入CSS Module样式
import scheduler, { PriorityLevel, UserCallback } from "@/libs/scheduler";

// 生成随机的时间和数据
const generateData = (startTime: number) => {
  const data = [];
  for (let i = 0; i < 1; i++) { // 每次生成1个数据点
    const time = new Date(startTime + i * 1000); // 每1000ms生成一个时间点
    const value = Math.random() * 10; // 随机生成一个值
    data.push([time.toISOString(), value]);
  }
  return data;
};

const LineChart: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const completePoint: UserCallback = (didUserCallbackTimeout) => {
      if (didUserCallbackTimeout) {
        return completePoint;
      }

      const newData = generateData(startTime.current);
      setChartData((prev) => [...prev, ...newData]);
      startTime.current += 1000; // 每次更新时间为1000ms
      // 控制数据生成的间隔，使用setTimeout使得回调延迟1秒
      setTimeout(() => {
        scheduler.scheduleCallback(PriorityLevel.IDLE_PRIORITY, completePoint);
      }, 1000); // 每隔1秒调用一次回调，生成新的数据点

      return completePoint;
    };
    scheduler.scheduleCallback(PriorityLevel.IDLE_PRIORITY, completePoint);
  }, []);

  const option = {
    title: {
      text: "实时随机曲线图",
      left: "center",
      textStyle: {
        fontSize: 20,
        fontWeight: 600,
        color: "#333",
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0, 0, 0, 0.7)", // 设置tooltip背景
      textStyle: {
        fontSize: 12,
        color: "#fff",
      },
    },
    xAxis: {
      type: "time",
      boundaryGap: false,
      axisLabel: {
        color: "#999",
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#999",
        fontSize: 12,
      },
    },
    series: [
      {
        name: "数据",
        type: "line",
        showSymbol: false,
        data: chartData,
        smooth: true,
        lineStyle: {
          color: "#42a5f5",
          width: 2,
        },
      },
    ],
  };

  return (
    <div className={styles.chartContainer}>
      <ReactECharts option={option} style={{ height: "100%" }} />
    </div>
  );
};

export default LineChart;
