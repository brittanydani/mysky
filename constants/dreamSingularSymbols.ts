import { characters_symbols } from "./dream_symbols/characters";
import { activities_symbols } from "./dream_symbols/activities";
import { emotions_symbols } from "./dream_symbols/emotions";
import { descriptive_elements_symbols } from "./dream_symbols/descriptive_elements";
import { misfortunes_symbols } from "./dream_symbols/misfortunes";
import { striving_symbols } from "./dream_symbols/striving";
import { social_interactions_symbols } from "./dream_symbols/social_interactions";
import { good_fortunes_symbols } from "./dream_symbols/good_fortunes";
import { settings_symbols } from "./dream_symbols/settings";
import { general_objects_symbols } from "./dream_symbols/general_objects";
import { weapons_symbols } from "./dream_symbols/weapons";
import { clothing_symbols } from "./dream_symbols/clothing";
import { electronics_symbols } from "./dream_symbols/electronics";
import { household_symbols } from "./dream_symbols/household";
import { tools_symbols } from "./dream_symbols/tools";
import { vehicles_symbols } from "./dream_symbols/vehicles";
import { containers_symbols } from "./dream_symbols/containers";
import { sports_equipment_symbols } from "./dream_symbols/sports_equipment";
import { medical_items_symbols } from "./dream_symbols/medical_items";
import { office_items_symbols } from "./dream_symbols/office_items";
import { sexual_objects_symbols } from "./dream_symbols/sexual_objects";
import { food_eating_symbols } from "./dream_symbols/food_eating";
import { elements_from_past_symbols } from "./dream_symbols/elements_from_past";

export interface SingleWordSymbol {
  symbol: string;
  category: string;
}

export const DREAM_SINGLE_WORD_SYMBOLS: SingleWordSymbol[] = [
  ...characters_symbols,
  ...activities_symbols,
  ...emotions_symbols,
  ...descriptive_elements_symbols,
  ...misfortunes_symbols,
  ...striving_symbols,
  ...social_interactions_symbols,
  ...good_fortunes_symbols,
  ...settings_symbols,
  ...general_objects_symbols,
  ...weapons_symbols,
  ...clothing_symbols,
  ...electronics_symbols,
  ...household_symbols,
  ...tools_symbols,
  ...vehicles_symbols,
  ...containers_symbols,
  ...sports_equipment_symbols,
  ...medical_items_symbols,
  ...office_items_symbols,
  ...sexual_objects_symbols,
  ...food_eating_symbols,
  ...elements_from_past_symbols,
];
