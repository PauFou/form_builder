import "./preview.css";
import "@skemya/runtime/styles";

export const metadata = {
  title: "Skemya Form",
  description: "Complete this form",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  // Preview layout sans navigation ni header
  return <>{children}</>;
}
