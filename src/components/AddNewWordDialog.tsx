import React from "react";
import { Observable, Subject, timer } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { WordService } from "../services/Word.service";
import { Word, WordType, FrenchVerbForms } from "../models/word.model";

type EmptyProps = Readonly<{}>;

class Animation {
  public duration: number = 0;
  public animationClasses: {
    class: string;
    duration: number;
  }[];
  public fallbackClass;
  private stopAnimation$: Subject<void> = new Subject();

  public stopAnimation() {
    this.stopAnimation$.next();
  }

  public getAnimation() {
    return new Observable<string>((subscriber) => {
      let innerDuration = 0;
      this.animationClasses.forEach((anim) => {
        timer(innerDuration).subscribe(() => subscriber.next(anim.class));
        innerDuration += anim.duration;
      });
      timer(innerDuration).subscribe(() => subscriber.next(this.fallbackClass));
    }).pipe(takeUntil(this.stopAnimation$));
  }

  constructor(config?: {
    animationClasses?: {
      class: string;
      duration: number;
    }[];
    fallbackClass?: string;
  }) {
    this.animationClasses = config?.animationClasses || [];
    this.fallbackClass = config?.fallbackClass || "";
  }
}

const notificationAnimation = new Animation();
notificationAnimation.animationClasses = [
  {
    class: "notification",
    duration: 4000,
  },
  {
    class: "notificationFadeOut",
    duration: 1200,
  },
];
notificationAnimation.fallbackClass = "transparent";

interface AddNewWordState {
  word: Word;
  wordType: typeof WordType[number];
  animationClass: string;
}

export class AddNewWordDialog extends React.Component<{}, AddNewWordState> {
  private wordService: WordService;

  constructor(props: EmptyProps) {
    super(props);

    this.wordService = new WordService();

    this.state = {
      wordType: "verb",
      word: {
        french: {
          type: "verb",
        },
      } as Word,
      animationClass: notificationAnimation.fallbackClass,
    };
  }

  public setEnglishWord(word: string) {
    this.setState({
      word: {
        ...this.state.word,
        translation: word,
      },
    });
  }

  public setFrenchWord(word: string, key: string) {
    const stateWord: Word = this.state.word;
    // @ts-ignore:
    stateWord.french![key] = word;
    // word
    this.setState({
      word: stateWord,
    });
  }

  public saveWord() {
    if (this.state.word) {
      this.wordService.addWord(this.state.word);
    }
    // if (
    //   frenchVerbKeys.filter((key) => !!this.state.french[key]).length &&
    //   this.state.english !== ""
    // ) {
    //   items.pipe(first()).subscribe((currentItems) => {
    //     if (
    //       !currentItems.find(
    //         (item) =>
    //           item.original === this.state.french ||
    //           item.translation === this.state.english
    //       )
    //     ) {
    //       currentItems.push({
    //         original: this.state.french,
    //         translation: this.state.english,
    //       });
    //       items.next(currentItems);
    //     } else {
    //       notificationAnimation.stopAnimation();
    //       notificationAnimation.getAnimation().subscribe((animationClass) => {
    //         this.setState({
    //           animationClass: animationClass,
    //         });
    //       });
    //     }
    //   });
    // }
  }

  render() {
    return (
      <div>
        <h2>Add new word</h2>
        <div className="flex">
          <div>
            {FrenchVerbForms.map((key) => (
              <div className="inputWithHint">
                <div className="hint">{key}</div>
                <input
                  onChange={(event) =>
                    this.setFrenchWord(event.target.value, key)
                  }
                />
              </div>
            ))}
          </div>
          <div className="inputWithHint">
            <div className="hint">English</div>
            <input
              onChange={(event) => this.setEnglishWord(event.target.value)}
            />
          </div>
        </div>

        <div className="flex">
          <button className="defaultButton" onClick={() => this.saveWord()}>
            Save
          </button>
          <div className={this.state.animationClass}>
            This word is already in vocabulary
          </div>
        </div>
      </div>
    );
  }
}
