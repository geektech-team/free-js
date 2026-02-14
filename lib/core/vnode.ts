import { Component, ComponentProps } from './component';

export interface HTMLProps {
  [key: string]: any;
  className?: string;
  style?: Record<string, string | number>;
  'v-model'?: string;
  'v-if'?: boolean;
  'v-for'?: string;
  'v-show'?: boolean;
}

export interface EventListeners {
  [eventName: string]: (event: Event) => void;
}

export interface HTMLNode {
  tag: string;
  props?: HTMLProps;
  children?: Array<VNode | string>;
  listeners?: EventListeners;
}

export interface ComponentNode<P extends ComponentProps = ComponentProps> {
  component: new (props: P) => Component<P>;
  props?: P;
  children?: Array<VNode | string>;
  emitters?: Record<string, () => void>;
}

export interface SlotProvider {
  tag: 'slot';
  props: { name: string };
}

export interface SlotInjector {
  tag: string;
  slot: string;
}

export type VNode = HTMLNode | ComponentNode | SlotProvider | SlotInjector;

// 辅助函数：创建HTML元素的VNode
export function h(
  tag: string,
  props?: HTMLProps,
  children?: Array<VNode | string>,
  listeners?: EventListeners
): HTMLNode {
  return {
    tag,
    props,
    children,
    listeners,
  };
}

// 辅助函数：创建组件的VNode
export function component<P extends ComponentProps>(
  componentClass: new (props: P) => Component<P>,
  props?: P,
  children?: Array<VNode | string>
): ComponentNode<P> {
  return {
    component: componentClass,
    props,
    children,
  };
}

// 辅助函数：创建插槽
export function slot(name: string): SlotProvider {
  return {
    tag: 'slot',
    props: { name },
  };
}
