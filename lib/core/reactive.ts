// 创建一个响应式对象
export function reactive(target: any) {
  return new Proxy(target, {
    get(target, key: string, receiver) {
      console.log(`获取${key}`);
      return Reflect.get(target, key, receiver);
    },
    set(target, key: string, value, receiver) {
      console.log(`设置${key}: ${value}`);
      const result = Reflect.set(target, key, value, receiver);
      // 这里可以添加更新DOM的逻辑
      updateDOM(key, value);
      return result;
    }
  });
}

// 更新DOM的函数，这里只是示例，具体实现需要根据实际情况
function updateDOM(key: string, value: string) {
  if (key === 'textContent') {
    document.body.textContent = value;
  }
}