import React, { createContext, useContext, useState } from "react";
import styles from "./index.less";


export const Modal: React.FC = () => {
    const { visible, close, title, content } = useModal();
  
    if (!visible) return null;
  
    return (
      <div className={styles.overlay} onClick={close}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h3>{title}</h3>
            <button className={styles.closeBtn} onClick={close}>&times;</button>
          </div>
          <div className={styles.content}>
            {content}
          </div>
          <div className={styles.footer}>
            <button className={styles.footerBtn} onClick={close}>关闭</button>
          </div>
        </div>
      </div>
    );
  };

interface ModalContextType {
  open: (title: string, content: React.ReactNode) => void;
  close: () => void;
  visible: boolean;
  title: string;
  content: React.ReactNode;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider= ({ children }: any) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<React.ReactNode>(null);

  const open = (newTitle: string, newContent: React.ReactNode) => {
    setTitle(newTitle);
    setContent(newContent);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return (
    <ModalContext.Provider value={{ open, close, visible, title, content }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
