import { Code2 } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>
          &copy; {currentYear} Family & Lifestyle Medicine. All rights reserved.
        </p>
        <a
          href="https://rindra.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          <span>Developed by <span className="font-medium">rindra.org</span></span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
