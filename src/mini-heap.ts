type Compare<T> = (a: T, b: T) => number;

export interface MiniHeapType<T> {
  push: (v: T) => void;
  peek: () => T;
  pop: () => T | undefined;
}

/** 实现一个小顶堆 用来维护最高优先级任务队列 */
export class MiniHeap<T> implements MiniHeapType<T> {
  private data: T[];
  private compare: Compare<T>;
  constructor(compare?: Compare<T>) {
    this.data = [];
    this.compare =
      compare ||
      function (a, b) {
        return (a as number) - (b as number);
      };
  }

  /** 增加元素 */
  push(value: T) {
    const index = this.data.length;
    this.data[index] = value;

    this.shiftUp(index);
  }

  /** 获取顶部元素 */
  peek() {
    return this.data[0];
  }

  /** 从顶部删除元素 */
  pop() {
    if (this.data.length <= 1) {
      return this.data.shift();
    }
    const root = this.data[0];
    const last = this.data.pop();

    if (last !== void 0 && root !== last) {
      this.data[0] = last;

      this.shiftDown(0);
      return root;
    } else {
      return root;
    }
  }

  /* 向上调整 */
  shiftUp(i: number) {
    /** i === 0 根节点不用向上调整 */
    while (i > 0) {
      // 找到parentIndex
      const parentIndex = i >>> 1;
      const parentValue = this.data[parentIndex];
      const currentValue = this.data[i];
      if (this.compare(parentValue, currentValue) > 0) {
        /** 和父节点交换 */
        swap(this.data, i, parentIndex);

        /** 设置新的i */
        i = parentIndex;
      } else {
        /** 满足小顶堆 不调整 */
        return;
      }
    }
  }

  /** 向下调整 */
  shiftDown(i: number) {
    /** 调整到最后一个非叶子结点 */
    const len = this.data.length;
    const lastParentIndex = (len >>> 1) - 1;
    /** 叶子结点 不用调整 */
    while (i <= lastParentIndex) {
      /** 获取左右孩子 */
      const leftChildIndex = (i + 1) * 2 - 1;
      const rightChildIndex = leftChildIndex + 1;

      const currentValue = this.data[i];
      const leftChild = this.data[leftChildIndex];
      const rightChild = this.data[rightChildIndex];
      /** i 不是叶子结点 一定有左孩子 */
      if (this.compare(currentValue, leftChild) > 0) {
        /** i不是最小的情况下 leftChild小 需要和rightChild（若存在） 比 找到最小的一个 */
        if (rightChildIndex < len && this.compare(leftChild, rightChild) > 0) {
          /** right存在 且小 交换right和i 并且修改i为rightIndex [i > left > right]*/
          swap(this.data, i, rightChildIndex);

          i = rightChildIndex;
        } else {
          /** right不存在 或者 left < right 交换left和i 并且修改i为leftIndex [i > right > left]*/
          swap(this.data, i, leftChildIndex);

          i = leftChildIndex;
        }
      } else {
        /** i 可能是最小的情况下  此时比较i和right 找出最小值 （若存在）*/
        if (
          rightChildIndex < len &&
          this.compare(currentValue, rightChild) > 0
        ) {
          /** right存在 且最小 left > i > right */
          swap(this.data, i, rightChildIndex);

          i = rightChildIndex;
        } else {
          /** 最后一种 i最小 不处理 已经是小顶堆 */
          return;
        }
      }
    }
  }

  /** 展示树结构 */
  show() {
    const arr = this.data;
    if (!arr || arr.length === 0) return "";

    // Helper function to build the tree string
    function buildTreeString(index: number, level: number, space: number) {
      if (
        index >= arr.length ||
        arr[index] === null ||
        arr[index] === undefined
      )
        return "";

      const node = arr[index];
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;

      let treeString = "";

      // Build right subtree
      treeString += buildTreeString(rightIndex, level + 1, space + 6);

      // Add current node with proper indentation and branch lines
      treeString += " ".repeat(space) + node + "\n";

      // Build left subtree
      treeString += buildTreeString(leftIndex, level + 1, space + 6);

      return treeString;
    }

    // Start building the tree string from the root node (index 0)
    return buildTreeString(0, 0, 0);
  }

  toString = this.show;
  toJSON = this.show;
  valueOf = this.show;
}

function swap(arr: any[], i: number, j: number) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}
