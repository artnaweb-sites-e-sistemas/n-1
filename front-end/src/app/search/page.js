import SearchAreaMain from "@components/search-area";

export const metadata = {
  title: "N-1 Edições - Busca",
};

export default function SearchPage({searchParams:{query}}) {
  return (
    <SearchAreaMain searchText={query} />
  );
}
