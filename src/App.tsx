import React, { useState } from "react";
import "./App.scss";
import { BehaviorSubject, Observable, Subject, timer } from "rxjs";
import { first, takeUntil } from "rxjs/operators";
import { ContextMenu, ContextMenuProps } from "./components/ContextMenu";
import { AddNewWordDialog } from "./components/AddNewWordDialog";
import { WordService } from "./services/Word.service";
import {
  Word,
  FrenchNoun,
  FrenchNounForms,
  UnknownWord,
  FrenchVerbForms,
  FrenchVerb,
  WordType,
} from "./models/word.model";

type EmptyProps = Readonly<{}>;

const cells: string[] = ["one", "two", "three"];

function getCells() {
  return cells.map((cell) => <li>{cell}</li>);
}

interface VocabularyTrainerState {
  displayAll: boolean;
  swapColumns: boolean;
  showTemporary?: {
    index?: number;
    key?: string;
  };
  items: Word[];
  contextMenu?: ContextMenuProps;
}

enum TranslationStateEnum {
  Original = "Original",
  Translation = "Translation",
  Both = "Both",
}

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

class VocabularyTrainer extends React.Component<
  EmptyProps,
  VocabularyTrainerState
> {
  private preventTimer: Subject<void> = new Subject();
  private wordService: WordService = new WordService();

  constructor(props: EmptyProps) {
    super(props);

    this.state = {
      displayAll: true,
      swapColumns: false,
      items: [],
    };
  }

  componentDidMount() {
    this.wordService.getWords().subscribe((words) => {
      console.log("new words", words);
      this.setState({
        ...this.state,
        items: words,
      });
    });
  }

  public showTemporary(arg: { index?: number; key?: string }) {
    this.preventTimer.next();
    if (isNaN(Number(arg.index))) {
      this.setState({
        showTemporary: undefined,
      });
    } else {
      timer(1500)
        .pipe(takeUntil(this.preventTimer))
        .subscribe(() =>
          this.setState({
            showTemporary: arg,
          })
        );
    }
  }

  public toggleDisplayAll() {
    this.setState({
      displayAll: !this.state.displayAll,
    });
  }

  public swapColumns() {
    this.setState({
      swapColumns: !this.state.swapColumns,
    });
  }

  public clickOnItem(index: number) {
    console.log("hi", index);
  }

  public renderItem(item: Word, index: number) {
    // try to divide colums on "left" and "right"

    const leftColumnClass =
      !this.state.displayAll && this.state.swapColumns ? " transparent" : "";
    // only left column should be hidden
    const rightColumnClass =
      !this.state.displayAll &&
      !this.state.swapColumns &&
      index !== this.state.showTemporary?.index
        ? " transparent"
        : "";

    // remove item on right click
    const rightClickHandler = ((event: React.MouseEvent) => {
      event.preventDefault();
      this.setState({
        contextMenu: {
          items: [
            {
              label: "remove item",
              callback: () => {
                this.state.items.splice(index, 1);
                this.setState({
                  items: this.state.items,
                });
              },
            },
          ],
          event: event,
        },
      });
      this.clickOnItem(index);
    }).bind(this);

    const itemRendered =
      item.french?.type === "unknown" ? (
        <tr
          className="vocabularyTrainer-item"
          onContextMenu={rightClickHandler}
        >
          {this.state.swapColumns ? (
            <React.Fragment>
              <td className={"vocabularyTrainer-original" + rightColumnClass}>
                {item.translation}
              </td>
              <td
                onMouseOver={() => this.showTemporary({ index: index })}
                onMouseOut={() => this.showTemporary({})}
              ></td>
              <td
                onMouseOver={() => this.showTemporary({ index: index })}
                onMouseOut={() => this.showTemporary({})}
                className={
                  this.state.showTemporary?.index === index
                    ? ""
                    : leftColumnClass
                }
              >
                {item.french.word}
              </td>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <td></td>
              <td className={leftColumnClass}>{item.french}</td>
              <td
                onMouseOver={() => this.showTemporary({ index: index })}
                onMouseOut={() => this.showTemporary({})}
                className={"vocabularyTrainer-original" + rightColumnClass}
              >
                {item.translation}
              </td>
            </React.Fragment>
          )}
        </tr>
      ) : (
        FrenchVerbForms.filter((key) => (item.french as FrenchVerb)[key]).map(
          (key, proformIndex, array) => {
            const original = (
              <React.Fragment>
                <td className="vocabularyTrainer-proform">{key}</td>
                <td
                  onMouseOver={() =>
                    this.showTemporary({ index: index, key: key })
                  }
                  onMouseOut={() => this.showTemporary({})}
                  className={
                    this.state.showTemporary?.key === key &&
                    index === this.state.showTemporary?.index
                      ? ""
                      : leftColumnClass
                  }
                >
                  {(item.french as FrenchVerb)[key]}
                </td>
              </React.Fragment>
            );
            const translation = (
              <td
                onMouseOver={() => this.showTemporary({ index: index })}
                onMouseOut={() => this.showTemporary({})}
                rowSpan={array.length}
                className={"vocabularyTrainer-original" + rightColumnClass}
              >
                {item.translation}
              </td>
            );
            return (
              <tr
                className="vocabularyTrainer-item"
                onContextMenu={rightClickHandler}
              >
                {this.state.swapColumns
                  ? [!proformIndex ? translation : null, original]
                  : [original, !proformIndex ? translation : null]}
              </tr>
            );
          }
        )
      );

    return [
      itemRendered,
      this.state.items.length - 1 !== index ? (
        <tr className="vocabularyTrainer-divider">
          <td colSpan={3}></td>
        </tr>
      ) : null,
    ];
  }

  render() {
    return (
      <div>
        <h2>Known words</h2>
        <div className="flex" style={{ width: "100%" }}>
          <button className="defaultButton" onClick={() => this.swapColumns()}>
            Swap columns
          </button>
          <button
            className="defaultButton"
            onClick={() => this.toggleDisplayAll()}
          >
            {this.state.displayAll ? "Hide" : "Show"} all
          </button>
        </div>
        <table>
          <thead>
            {!this.state.swapColumns ? (
              <tr className="vocabularyTrainer-item">
                <th colSpan={2}>French</th>
                <th>English</th>
              </tr>
            ) : (
              <tr className="vocabularyTrainer-item">
                <th>English</th>
                <th colSpan={2}>French</th>
              </tr>
            )}
          </thead>
          <tbody>
            {this.state.items.map((item, index) =>
              this.renderItem(item, index)
            )}
          </tbody>
        </table>
        <ContextMenu
          items={this.state.contextMenu?.items}
          event={this.state.contextMenu?.event}
        />
      </div>
    );
  }
}

interface CollapsableAreaState {
  isActive: boolean;
}

class CollapsableArea extends React.Component<{}, CollapsableAreaState> {
  public toggle() {
    this.setState({
      isActive: !this.state.isActive,
    });
  }

  constructor(props: Readonly<{}>) {
    super(props);
    this.state = {
      isActive: true,
    };
  }

  public render() {
    return (
      <div className="container">
        <div className="container--toggle" onClick={() => this.toggle()}>
          {this.state.isActive ? "▼" : "►"}
        </div>

        {this.state.isActive ? this.props.children : ""}
      </div>
    );
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

function App() {
  return (
    <div className="App">
      <VocabularyTrainer />
      <AddNewWordDialog />
    </div>
  );
}

export default App;
