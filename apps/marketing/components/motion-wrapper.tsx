"use client";

import { motion, MotionProps } from "framer-motion";
import { forwardRef } from "react";

// Client-only wrapper for motion components to avoid SSR issues
export const MotionDiv = forwardRef<HTMLDivElement, MotionProps & React.HTMLProps<HTMLDivElement>>(
  (props, ref) => {
    if (typeof window === "undefined") {
      // During SSR, render a plain div without animations
      const { initial, animate, whileInView, viewport, transition, ...rest } = props;
      return <div ref={ref} {...rest} />;
    }
    return <motion.div ref={ref} {...props} />;
  }
);

MotionDiv.displayName = "MotionDiv";

export const MotionH1 = forwardRef<
  HTMLHeadingElement,
  MotionProps & React.HTMLProps<HTMLHeadingElement>
>((props, ref) => {
  if (typeof window === "undefined") {
    const { initial, animate, whileInView, viewport, transition, ...rest } = props;
    return <h1 ref={ref} {...rest} />;
  }
  return <motion.h1 ref={ref} {...props} />;
});

MotionH1.displayName = "MotionH1";

export const MotionH2 = forwardRef<
  HTMLHeadingElement,
  MotionProps & React.HTMLProps<HTMLHeadingElement>
>((props, ref) => {
  if (typeof window === "undefined") {
    const { initial, animate, whileInView, viewport, transition, ...rest } = props;
    return <h2 ref={ref} {...rest} />;
  }
  return <motion.h2 ref={ref} {...props} />;
});

MotionH2.displayName = "MotionH2";

export const MotionH3 = forwardRef<
  HTMLHeadingElement,
  MotionProps & React.HTMLProps<HTMLHeadingElement>
>((props, ref) => {
  if (typeof window === "undefined") {
    const { initial, animate, whileInView, viewport, transition, ...rest } = props;
    return <h3 ref={ref} {...rest} />;
  }
  return <motion.h3 ref={ref} {...props} />;
});

MotionH3.displayName = "MotionH3";

export const MotionP = forwardRef<
  HTMLParagraphElement,
  MotionProps & React.HTMLProps<HTMLParagraphElement>
>((props, ref) => {
  if (typeof window === "undefined") {
    const { initial, animate, whileInView, viewport, transition, ...rest } = props;
    return <p ref={ref} {...rest} />;
  }
  return <motion.p ref={ref} {...props} />;
});

MotionP.displayName = "MotionP";
