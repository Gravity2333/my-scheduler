import React, { useEffect, useRef, useState } from "react";
import styles from "./index.less";

const Ball: React.FC = () => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const moveBall = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // 随机生成小球的新位置，确保小球完全位于容器内
        const newTop = Math.random() * (containerHeight - 50); // 小球的高度为50px
        const newLeft = Math.random() * (containerWidth - 50); // 小球的宽度为50px

        setPosition({ top: newTop, left: newLeft });
      }
    };

    const intervalId = setInterval(moveBall, 1000); // 每秒更新一次位置

    return () => clearInterval(intervalId); // 清除定时器
  }, []);

  return (
    <div
      className={styles.container}
      ref={containerRef}
      style={{ position: "relative", width: "100vw", height: "200px" }} // 设置容器的大小
    >
      <div
        className={styles.ball}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      ></div>
    </div>
  );
};

export default Ball;
