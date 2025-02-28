export interface VNode {
  tag?: string;
  component?: new (props: Record<string, any>) => any;
  props?: Record<string, any>;
  children?: (VNode | string | null | undefined)[];
  listeners?: Record<string, EventListener>;
} 