declare module "vanta/dist/vanta.dots.min" {
  type DotsOptions = {
    el: HTMLElement;
    THREE: typeof import("three");
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number;
    color?: number;
    color2?: number;
    size?: number;
    spacing?: number;
    showLines?: boolean;
  };

  type DotsEffect = {
    destroy: () => void;
  };

  const dots: (options: DotsOptions) => DotsEffect;

  export default dots;
}
