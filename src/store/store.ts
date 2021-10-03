import { configureStore } from "@reduxjs/toolkit";
import { FrenchVerb, FrenchNoun } from "../models/word.model";

interface Word {
  translation: string | FrenchNoun | FrenchVerb;
  original: string;
}

interface UserData {
  login: string;
  id: string;
  token: string;
}

interface RootState {
  user: UserData;
  words: Word[];
}

export default configureStore({
  reducer: {},
});
