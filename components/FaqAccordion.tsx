"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, X as CloseIcon } from "lucide-react";

const FAQ_CLOSED_KEY = "faqClosed";

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  isOpen,
  onClick,
}) => {
  return (
    <div className="border-b border-neutral-700 last:border-b-0">
      <button
        onClick={onClick}
        className="flex justify-between items-center w-full py-5 px-6 text-left text-lg md:text-xl font-medium text-neutral-100 hover:bg-neutral-800 transition-colors duration-200"
      >
        <span>{question}</span>
        {isOpen ? <Minus size={24} /> : <Plus size={24} />}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-neutral-300 text-base leading-relaxed animate-fadeIn">
          <p dangerouslySetInnerHTML={{ __html: answer }} />
        </div>
      )}
    </div>
  );
};

const faqData = [
  {
    question: "Что такое WatchList?",
    answer: `<span style="color: #FACC15;">WatchList</span> — это ваш персональный гид в мире кино и сериалов. Мы помогаем находить интересный контент, отслеживать просмотренное и планировать, что посмотреть дальше. Собирайте свою коллекцию фильмов и сериалов, получайте рекомендации и открывайте новинки. На <span style="color: #FACC15;">WatchList</span> вы можете смотреть фильмы на русском и английском (в оригинале), для большинства есть субтитры. <span style="color: #FACC15;">WatchList</span> упрощает выбор!`,
  },
  {
    question: "Это правда бесплатно?",
    answer: `Абсолютно! С <span style="color: #FACC15;">WatchList</span> вы можете бесплатно просматривать огромную коллекцию фильмов — данные о фильмах берутся из <span style="color: #3B82F6 !important; font-weight: bold;">TMDB</span>, которая насчитывает более 100 000 наименований. Вы можете не только смотреть контент онлайн, но и легко выводить его на экран вашего телевизора. Для многих фильмов доступна возможность скачивания для офлайн-просмотра, а также поддержка качества вплоть до 4K Ultra HD, чтобы вы наслаждались лучшей картинкой.`,
  },
  {
    question: "В каких странах доступен WatchList?",
    answer: `<span style="color: #FACC15;">WatchList</span> доступен по всему миру, так как является веб-приложением, работающим в вашем браузере. Доступность контента из TMDB может незначительно отличаться в зависимости от региональных политик самой TMDB, но сам <span style="color: #FACC15;">WatchList</span> будет работать везде, где есть интернет.`,
  },
  {
    question: "Нужен ли мне аккаунт для WatchList?",
    answer: `Нет, аккаунт не требуется! <span style="color: #FACC15;">WatchList</span> спроектирован для работы полностью локально в вашем браузере. Все ваши списки фильмов, история просмотров и индивидуальные настройки сохраняются непосредственно на вашем устройстве. Это обеспечивает максимальную приватность, скорость и независимость от внешних серверов. Ваши данные всегда под вашим контролем.`,
  },
  {
    question: "Могу ли я настроить WatchList по своему вкусу?",
    answer: `<p style="color: #A3A3A3;">Конечно! <span style="color: #FACC15;">WatchList</span> предлагает гибкие настройки:<br>- Вид отображения: сетка или список.<br>- Размер постеров: от маленьких до больших.<br>- Отступы между постерами.<br>- Отображение рейтингов, названий, эффектов подсветки.<br>Все настройки на вашей странице <a href='/profile' style='color: #3B82F6; text-decoration: underline;'>Профиля</a>. Мы постоянно добавляем новые опции!</p>`,
  },
];

const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const faqClosed = localStorage.getItem(FAQ_CLOSED_KEY);
      if (faqClosed !== "true") {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // В SSR или если localStorage недоступен, не показываем по умолчанию
      // или можно решить показывать, если это предпочтительнее
      setIsVisible(false);
    }
  }, []);

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleClose = () => {
    try {
      localStorage.setItem(FAQ_CLOSED_KEY, "true");
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-700">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-exo-2">
            Остались вопросы? У нас есть ответы!
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-full transition-colors"
            aria-label="Закрыть FAQ"
          >
            <CloseIcon size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {faqData.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>
        <div className="p-6 border-t border-neutral-700 flex justify-start">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Всё понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaqAccordion;
