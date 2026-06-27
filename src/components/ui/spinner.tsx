import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader"

function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <QuantumOrbitLoader variant="inline" size="sm" className={className} />
  )
}

export { Spinner }

