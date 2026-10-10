import { Suspense } from "react";
import { FavouritesPicker } from "./favourites-picker";

export default function FavouritesPage() {
  return (
    <Suspense>
      <FavouritesPicker />
    </Suspense>
  );
}
