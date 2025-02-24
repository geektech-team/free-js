export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  children: (VNode | string)[];
  listeners?: Record<string, EventListener>;
} 