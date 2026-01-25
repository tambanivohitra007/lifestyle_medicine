import { Code2 } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-3 sm:py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
        <p className="text-center sm:text-left">
          &copy; {currentYear} Family & Lifestyle Medicine
        </p>
        <a
          href="https://rindra.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 active:text-primary-700 transition-colors touch-manipulation"
        >
          <Code2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          <span>Developed by <span className="font-medium">rindra.org</span></span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
