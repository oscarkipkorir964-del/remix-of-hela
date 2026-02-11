const DecorativeBackground = () => {
  const patterns = [
    { text: "zenka", top: "5%", left: "5%", rotate: "-15deg", size: "text-4xl" },
    { text: "zenka", top: "15%", right: "10%", rotate: "20deg", size: "text-6xl" },
    { text: "loans", top: "25%", left: "15%", rotate: "10deg", size: "text-3xl" },
    { text: "zenka", top: "35%", right: "5%", rotate: "-25deg", size: "text-5xl" },
    { text: "zenka", top: "45%", left: "3%", rotate: "30deg", size: "text-4xl" },
    { text: "loans", top: "55%", right: "15%", rotate: "-10deg", size: "text-3xl" },
    { text: "zenka", top: "65%", left: "20%", rotate: "15deg", size: "text-6xl" },
    { text: "zenka", top: "75%", right: "8%", rotate: "-20deg", size: "text-4xl" },
    { text: "loans", top: "85%", left: "8%", rotate: "25deg", size: "text-5xl" },
    { text: "zenka", bottom: "5%", right: "20%", rotate: "-5deg", size: "text-3xl" },
    { text: "zenka", top: "10%", left: "40%", rotate: "35deg", size: "text-5xl" },
    { text: "loans", top: "50%", left: "45%", rotate: "-30deg", size: "text-4xl" },
    { text: "zenka", top: "80%", left: "50%", rotate: "12deg", size: "text-3xl" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {patterns.map((pattern, index) => (
        <span
          key={index}
          className={`absolute font-bold ${pattern.size} text-primary/[0.03] dark:text-primary/[0.05] select-none whitespace-nowrap`}
          style={{
            top: pattern.top,
            left: pattern.left,
            right: pattern.right,
            bottom: pattern.bottom,
            transform: `rotate(${pattern.rotate})`,
          }}
        >
          {pattern.text}
        </span>
      ))}
      
      {/* Decorative circles */}
      <div className="absolute top-[20%] left-[60%] w-32 h-32 rounded-full border-2 border-primary/[0.03] dark:border-primary/[0.05]" />
      <div className="absolute top-[60%] left-[10%] w-48 h-48 rounded-full border-2 border-primary/[0.02] dark:border-primary/[0.04]" />
      <div className="absolute top-[40%] right-[5%] w-24 h-24 rounded-full bg-primary/[0.02] dark:bg-primary/[0.03]" />
      <div className="absolute bottom-[15%] right-[30%] w-40 h-40 rounded-full border-4 border-dashed border-primary/[0.02] dark:border-primary/[0.04]" />
      
      {/* Decorative squares */}
      <div className="absolute top-[30%] left-[70%] w-20 h-20 rotate-45 border-2 border-primary/[0.03] dark:border-primary/[0.05]" />
      <div className="absolute bottom-[25%] left-[25%] w-16 h-16 rotate-12 bg-primary/[0.02] dark:bg-primary/[0.03] rounded-lg" />
    </div>
  );
};

export default DecorativeBackground;
