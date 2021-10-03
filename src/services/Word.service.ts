import { Observable, BehaviorSubject, of } from "rxjs";
import { Word } from "../models/word.model";

const items: BehaviorSubject<Word[]> = new BehaviorSubject([] as Word[]);

items.next([
  {
    french: {
      infinitiv: "parler",
      je: "parle",
      type: "verb",
    },
    translation: "to speak",
  },
  {
    french: {
      infinitiv: "devoir",
      type: "verb",
    },
    translation: "to have to",
  },
  {
    french: {
      infinitiv: "être",
      type: "verb",
    },
    translation: "to be",
  },
  {
    french: {
      infinitiv: "lire",
      type: "verb",
    },
    translation: "to read",
  },
]);

export class WordService {
  constructor() {}

  public getWords(): Observable<Word[]> {
    console.log(items.getValue());
    return items;
  }

  public addWord(word: Word): Observable<Word> {
    items.next(items.getValue().concat(word));
    return of(word);
  }
}
