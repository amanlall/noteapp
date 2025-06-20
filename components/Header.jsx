/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Sun, Moon, Wand2 } from 'lucide-react';

const Header = ({ theme, setTheme }) => {
  const handleThemeToggle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('surprise');
    else setTheme('light'); // surprise to light
  };

  let ThemeIcon;
  let nextThemeTitle;

  if (theme === 'light') {
    ThemeIcon = Sun;
    nextThemeTitle = 'Switch to Dark Theme';
  } else if (theme === 'dark') {
    ThemeIcon = Moon;
    nextThemeTitle = 'Switch to Surprise Theme';
  } else { // surprise
    ThemeIcon = Wand2;
    nextThemeTitle = 'Switch to Light Theme';
  }

  const headerBaseClasses = "sticky top-0 w-full p-4 z-20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)";
  const headerThemeClasses = theme === 'light' ? 'bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-sm' :
                             theme === 'dark' ? 'bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 shadow-sm' :
                             'bg-white/60 backdrop-blur-md border-b border-white/30 shadow-lg'; // surprise

  const titleTextClasses = theme === 'surprise' ? 'text-gray-900' : 'text-black dark:text-white';
  const poweredByTextClasses = theme === 'surprise' ? 'text-gray-700' : 'text-gray-500 dark:text-slate-400';
  const linkClasses = theme === 'surprise' ? 'hover:text-blue-700' : 'hover:text-gray-800 dark:hover:text-slate-200';

  const buttonThemeClasses = theme === 'light' ? 'text-yellow-500 hover:bg-gray-200/80 hover:neon-glow-blue' :
                             theme === 'dark' ? 'text-blue-300 hover:bg-slate-700/80 hover:neon-glow-blue' :
                             'text-purple-600 hover:bg-white/50 hover:neon-glow-purple'; // surprise

  return (
    <div className={`${headerBaseClasses} ${headerThemeClasses} slide-in-top`}>
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-base fade-in">
          <span className={`font-bold text-xl transition-all duration-300 hover-lift ${titleTextClasses}`}>
            <span className="animate-gradient-text">Amanzing</span> Notes
          </span>

        </div>
        <div className="fade-in">
          <button
            type="button"
            onClick={handleThemeToggle}
            title={nextThemeTitle}
            className={`p-2 rounded-full transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift rotate-in ${buttonThemeClasses}`}
            aria-label={nextThemeTitle}
          >
            <ThemeIcon size={22} className="transition-all duration-300 hover:scale-110 hover:rotate-12" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
