import WorkflowShell from "../../_components/workflow-shell";

interface WorkflowLayoutProps {
  params: Promise<{ workflowid: string }>;
  children: React.ReactNode;
}

export default async function WorkflowLayout({ params, children }: WorkflowLayoutProps) {
  const { workflowid } = await params;
  return <WorkflowShell strategyId={workflowid}>{children}</WorkflowShell>;
}
