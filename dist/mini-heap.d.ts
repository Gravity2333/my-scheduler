type Compare<T> = (a: T, b: T) => number;
export interface MiniHeapType<T> {
    push: (v: T) => void;
    peek: () => T;
    pop: () => T | undefined;
}
/** 实现一个小顶堆 用来维护最高优先级任务队列 */
export declare class MiniHeap<T> implements MiniHeapType<T> {
    private data;
    private compare;
    constructor(compare?: Compare<T>);
    /** 增加元素 */
    push(value: T): void;
    /** 获取顶部元素 */
    peek(): T;
    /** 从顶部删除元素 */
    pop(): T | undefined;
    shiftUp(i: number): void;
    /** 向下调整 */
    shiftDown(i: number): void;
    /** 展示树结构 */
    show(): string;
    toString: () => string;
    toJSON: () => string;
    valueOf: () => string;
}
export {};
