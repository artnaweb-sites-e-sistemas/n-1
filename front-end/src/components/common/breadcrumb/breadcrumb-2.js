const BreadcrumbTwo = ({ subtitle, title }) => {
  return (
    <section
      className="about__heading about__spacing grey-bg-17 about__heading--search"
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="about__heading-content text-center p-relative z-index-1">
              {subtitle && (
                <span className="about__heading-subtitle">{subtitle}</span>
              )}
              {title && <h3 className="about__heading-title">{title}</h3>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BreadcrumbTwo;
