import React from "react";

const social_links = [
  {
    link: "https://www.facebook.com/n.1edicoes",
    target: "_blank",
    icon: "fa-brands fa-facebook-f",
    name: "Facebook",
  },
  {
    link: "https://x.com/n_1edicoes",
    target: "_blank",
    icon: "fa-brands fa-x",
    name: "X (Twitter)",
  },
  {
    link: "https://www.instagram.com/n.1edicoes/",
    target: "_blank",
    icon: "fa-brands fa-instagram",
    name: "Instagram",
  },
  {
    link: "https://www.youtube.com/c/n1edies",
    target: "_blank",
    icon: "fa-brands fa-youtube",
    name: "Youtube",
  },
];

const SocialLinks = () => {
  return (
    <>
      {social_links.map((l, i) => (
        <a key={i} href={l.link} target={l.target}>
          <i className={l.icon}></i>
        </a>
      ))}
    </>
  );
};

export default SocialLinks;


export function SocialShare() {
  return (
    <>
      {social_links.slice(0, 3).map((l, i) => (
        <a key={i} href={l.link} target={l.target}>
          <i className={l.icon}></i>
        </a>
      ))}
    </>
  );
}
