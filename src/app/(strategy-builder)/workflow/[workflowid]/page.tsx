import Canvas from "../../_components";

interface WorkflowPageProps {
  params: Promise<{ workflowid: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workflowid } = await params;
  return <Canvas strategyId={workflowid} />;
}
