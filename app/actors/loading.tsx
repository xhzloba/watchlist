import GradientBackground from "@/components/gradient-background";
import Header from "@/components/header";

// Возвращаем идентичный UI структуре страницы, но без данных
export default function LoadingActors() {
  return (
    <GradientBackground>
      <Header />
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    </GradientBackground>
  );
}
