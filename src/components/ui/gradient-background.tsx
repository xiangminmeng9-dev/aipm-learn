export default function GradientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
    </div>
  );
}
