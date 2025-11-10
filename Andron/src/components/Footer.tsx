import Link from 'next/link';
import Image from 'next/image';
import { getImagePath } from "@/utils/imagePath";

const Footer = () => {
  return (
    <footer className="w-full bg-[#0B4CAC] py-16 text-white text-center">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 text-left">
        {[1, 2, 3, 4, 5].map((colIndex) => (
          <div key={colIndex} className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Lorem Ipsum</h3>
            <ul className="space-y-2">
              {[1, 2, 3, 4, 5].map((linkIndex) => (
                <li key={linkIndex} className="mb-2">
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition text-sm"
                  >
                    Lorem ipsum
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 flex flex-col items-center">
        <div className="bg-white px-3 py-1 rounded-full w-[66px] h-[66px] flex items-center justify-center">
          <Image
            src={getImagePath("/assets/icons/logo_colored.svg")}
            alt="Logo"
            width={60}
            height={60}
            className="mb-4 opacity-70"
          />
        </div>
        <p className="text-white-400 text-sm mb-6 mt-6">
          &copy; 2025 Lorem Ipsum All rights reserved.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition"
          >
            <Image
              src={getImagePath("/assets/icons/fb-white.svg")}
              alt="Facebook"
              width={10}
              height={10}
            />
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition"
          >
            <Image
              src={getImagePath("/assets/icons/twitter-white.svg")}
              alt="Twitter"
              width={20}
              height={20}
            />
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition"
          >
            <Image
              src={getImagePath("/assets/icons/instagram-white.svg")}
              alt="Instagram"
              width={20}
              height={20}
            />
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition"
          >
            <Image
              src={getImagePath("/assets/icons/combined-white.svg")}
              alt="Instagram"
              width={20}
              height={20}
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 