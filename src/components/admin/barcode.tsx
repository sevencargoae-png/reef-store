"use client";
import { useEffect, useRef } from "react";

export function Barcode({ value, width = 2, height = 60 }: { value: string; width?: number; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    import("jsbarcode").then((JsBarcode) => {
      JsBarcode.default(ref.current!, value, { format: "CODE128", width, height, displayValue: true, fontSize: 14, margin: 4 });
    });
  }, [value, width, height]);
  return <svg ref={ref} />;
}
