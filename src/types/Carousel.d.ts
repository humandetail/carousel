export type Indicator = 'number' | 'dot'

export type CarouselOptions = {
  autoplay?: boolean;
  delay?: number;
  loop?: boolean;
  draggable?: boolean;
  width?: number;
  height?: number;
  indicator?: false | Indicator;
  navButton?: boolean;
}

export type SwitchAction = 'prev' | 'next'
