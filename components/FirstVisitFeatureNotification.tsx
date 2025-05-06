import { motion } from "framer-motion";
import { X, Zap, Settings, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { playSound } from "@/lib/sound-utils";

interface FirstVisitFeatureNotificationProps {
  onEnableFeatures: () => void;
  onDismiss: () => void;
}

const FirstVisitFeatureNotification: React.FC<
  FirstVisitFeatureNotificationProps
> = ({ onEnableFeatures, onDismiss }) => {
  const handleEnableClick = () => {
    playSound("confirm.mp3");
    onEnableFeatures();
  };

  const handleDismissClick = () => {
    playSound("cancel.mp3");
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
      className="fixed bottom-0 inset-x-0 sm:bottom-6 sm:right-6 sm:left-auto z-[100] w-full sm:max-w-md rounded-t-xl sm:rounded-xl bg-gradient-to-tr from-slate-900 via-gray-800 to-yellow-900/50 p-4 sm:p-6 shadow-2xl border-t sm:border border-yellow-600/40 text-white backdrop-blur-sm"
    >
      <button
        onClick={handleDismissClick}
        className="absolute top-3 sm:top-3.5 right-3 sm:right-3.5 text-gray-500 hover:text-yellow-400 transition-colors p-1 rounded-full hover:bg-white/10 active:scale-90"
        aria-label="Закрыть уведомление"
      >
        <X size={20} />
      </button>

      <div className="flex items-start mb-3 sm:mb-4">
        <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mr-3 sm:mr-4 flex-shrink-0 mt-0 sm:mt-1" />
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-1">
            Новые возможности для вас!
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-normal sm:leading-relaxed">
            Включите умные уведомления о фильмах из той же{" "}
            <strong>коллекции</strong> и рекомендации по лентам с участием ваших
            любимых <strong>актеров</strong>. Настройте watchlist под себя!
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-400/80 mb-4 sm:mb-5 sm:pl-14 flex items-start border-t border-gray-700/60 pt-2.5 sm:pt-3 mt-3 sm:mt-4">
        <Settings
          size={18}
          className="mr-2 sm:mr-2.5 mt-px flex-shrink-0 text-gray-500/80 hidden sm:block"
        />
        <Settings
          size={20}
          className="mr-2 mt-px flex-shrink-0 text-gray-500/80 sm:hidden"
        />
        <span className="sm:ml-0">
          Эти и другие опции всегда доступны в разделе{" "}
          <Link
            href="/profile"
            className="text-yellow-500 hover:text-yellow-400 font-medium underline"
          >
            Настройки профиля
          </Link>
          .
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        <button
          onClick={handleEnableClick}
          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 text-sm shadow-lg hover:shadow-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <CheckCircle size={18} />
          Включить всё
        </button>
        <button
          onClick={handleDismissClick}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-200 font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <XCircle size={18} />
          Не сейчас
        </button>
      </div>
    </motion.div>
  );
};

export default FirstVisitFeatureNotification;
