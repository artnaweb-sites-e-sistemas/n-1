'use client';
import React, { useEffect } from "react";
import Link from "next/link";
import menu_data from "@layout/menu-data";

const SlideMenu = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`slide-menu__overlay ${isOpen ? 'slide-menu__overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        id="slide-menu-panel"
        className={`slide-menu__panel ${isOpen ? 'slide-menu__panel--open' : ''}`}
        aria-label="Menu principal"
      >
        <ul className="slide-menu__list">
          {menu_data.map((menu, i) => (
            <li key={i} className="slide-menu__item">
              {menu.isExternal ? (
                <a
                  href={menu.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="slide-menu__link"
                  onClick={onClose}
                >
                  {menu.title}
                </a>
              ) : (
                <Link
                  href={menu.link}
                  className="slide-menu__link"
                  onClick={onClose}
                >
                  {menu.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default SlideMenu;
