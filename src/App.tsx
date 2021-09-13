import React from 'react';
import './App.scss';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';


type EmptyProps = Readonly<{}>;

const cells: string[] = [
	"one",
	"two",
	"three"
]

interface FrenchVerb {
	[key: string]: string
}

const frenchVerbKeys = [
	"infinitiv",
	"je",
	"tu",
	"il/elle",
	"nous",
	"vous",
	"ils/elles",
	"imperatif"
]

function getCells() {
	return cells.map(cell => (<li>{cell}</li>));
}

interface VocabularyTrainerState {
	displayAll: boolean,
	swapColumns: boolean,
	showTemporary?: {
		index?: number,
		key?: string
	},
	items: VocabularyItem[],
	contextMenu?: ContextMenuProps
}

enum TranslationStateEnum {
	Original = 'Original',
	Translation = 'Translation',
	Both = 'Both'
}


interface VocabularyItem {
	original: FrenchVerb | string,
	translation: string,
}

interface VocabularyProps {
	items?: BehaviorSubject<VocabularyItem[]>
}

class Animation {
	public duration: number = 0;
	public animationClasses: {
		class: string,
		duration: number
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
			})
			timer(innerDuration).subscribe(() => subscriber.next(this.fallbackClass));

		}).pipe(takeUntil(this.stopAnimation$));
	}

	constructor(config?: {
		animationClasses?: {
			class: string,
			duration: number
		}[],
		fallbackClass?: string
	}) {
		this.animationClasses = config?.animationClasses || [];
		this.fallbackClass = config?.fallbackClass || '';
	}
}

interface ContextMenuProps {
	items?: {
		label: string,
		callback: () => void
	}[],
	showMenu?: boolean,
	coords?: { x: number, y: number }
}

class ContextMenu extends React.Component<ContextMenuProps> {
	public showMenu(coords: { x: number, y: number }) {
		this.setState({ showMenu: true, coords: coords });
	}

	public hideMenu() {
		this.setState({ showMenu: false });
	}

	constructor(props: ContextMenuProps) {
		super(props);
		this.setState({ showMenu: false });
	}

	public render() {
		if (this.props.showMenu) {
			return (
				<div style={{
					position: "fixed",
					top: this.props?.coords?.y.toString() + "px",
					left: this.props?.coords?.x.toString() + "px",
				}}
					className="contextMenu"
				>
					{this.props.items?.map(menuItem => (
						<div onClick={() => menuItem.callback()}>{menuItem.label}</div>
					))}
				</div>
			)
		} else {
			return ('')
		}
	}
}

class VocabularyTrainer extends React.Component<VocabularyProps, VocabularyTrainerState> {
	private preventTimer: Subject<void> = new Subject();

	constructor(props: VocabularyProps) {
		super(props);
		this.state = {
			displayAll: true,
			swapColumns: false,
			items: items.getValue()
		}
		items.subscribe((currentItems) => this.setState({
			items: currentItems
		}))
	}

	public showTemporary(arg: { index?: number, key?: string }) {
		this.preventTimer.next();
		if (isNaN(Number(arg.index))) {
			this.setState({
				showTemporary: undefined
			})
		} else {
			timer(1500).pipe(takeUntil(this.preventTimer)).subscribe(() => this.setState({
				showTemporary: arg
			}));
		}
	}

	public toggleDisplayAll() {
		this.setState({
			displayAll: !this.state.displayAll
		})
	}

	public swapColumns() {
		this.setState({
			swapColumns: !this.state.swapColumns
		})
	}

	public clickOnItem(index: number) {
		console.log("hi", index);
	}

	public renderItem(item: VocabularyItem, index: number) {
		// try to divide colums on "left" and "right"



		const leftColumnClass = !this.state.displayAll && this.state.swapColumns ? ' transparent' : '';
		// only left column should be hidden
		const rightColumnClass = !this.state.displayAll && !this.state.swapColumns && index !== this.state.showTemporary?.index ? ' transparent' : '';


		// remove item on right click
		const rightClickHandler = ((event: React.MouseEvent) => {
			event.preventDefault();
			this.setState({
				contextMenu: {
					items:
						[
							{
								label: "remove item",
								callback: () => {
									this.state.items.splice(index, 1)
									this.setState({
										items: this.state.items,
										contextMenu: {
											showMenu: false
										}
									})
								}
							}
						],
					showMenu: true,
					coords: {
						x: event.clientX,
						y: event.clientY
					}
				}
			})
			this.clickOnItem(index);
		}).bind(this);

		const itemRendered = typeof (item.original) === 'string' ? (
			<tr className="vocabularyTrainer-item"
				onContextMenu={rightClickHandler}>
				{this.state.swapColumns ? (
					<React.Fragment>
						<td className={"vocabularyTrainer-original" + rightColumnClass}>{item.translation}</td>
						<td onMouseOver={() => this.showTemporary({ index: index })}
							onMouseOut={() => this.showTemporary({})}></td>
						<td onMouseOver={() => this.showTemporary({ index: index })}
							onMouseOut={() => this.showTemporary({})}
							className={this.state.showTemporary?.index === index ? '' : leftColumnClass}>{item.original}</td>
					</React.Fragment>
				) : (
					<React.Fragment>
						<td></td>
						<td className={leftColumnClass}>{item.original}</td>
						<td onMouseOver={() => this.showTemporary({ index: index })}
							onMouseOut={() => this.showTemporary({})}
							className={"vocabularyTrainer-original" + rightColumnClass}>{item.translation}</td>
					</React.Fragment >
				)
				}

			</tr>
		) :
			frenchVerbKeys.filter((key: string) => (item.original as FrenchVerb)[key]).map((key, proformIndex, array) => {
				const original = (
					<React.Fragment>
						<td className="vocabularyTrainer-proform">{key}</td>
						<td onMouseOver={() => this.showTemporary({ index: index, key: key })}
							onMouseOut={() => this.showTemporary({})}
							className={this.state.showTemporary?.key === key && index === this.state.showTemporary?.index ? '' : leftColumnClass}>{(item.original as FrenchVerb)[key]}</td>
					</React.Fragment>
				)
				const translation = (
					<td onMouseOver={() => this.showTemporary({ index: index })}
						onMouseOut={() => this.showTemporary({})}
						rowSpan={array.length}
						className={"vocabularyTrainer-original" + rightColumnClass}>{item.translation}</td>
				)
				return (
					<tr className="vocabularyTrainer-item"
						onContextMenu={rightClickHandler}>
						{this.state.swapColumns ? [!proformIndex ? translation : null, original] : [original, !proformIndex ? translation : null]}
					</tr>
				)
			}
			)


		return [
			itemRendered,
			this.state.items.length - 1 !== index ? (<tr className="vocabularyTrainer-divider"><td colSpan={3}></td></tr>)
				: null
		];
	}

	render() {
		return (
			<div>
				<h2>Known words</h2>
				<div className="flex" style={{ width: "100%" }}>
					<button className="defaultButton" onClick={() => this.swapColumns()}>Swap columns</button>
					<button className="defaultButton" onClick={() => this.toggleDisplayAll()}>{this.state.displayAll ? 'Hide' : 'Show'} all</button>
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
						{this.state.items.map((item, index) => this.renderItem(item, index))}
					</tbody>
				</table>
				<ContextMenu
					items={this.state.contextMenu?.items}
					showMenu={this.state.contextMenu?.showMenu}
					coords={this.state.contextMenu?.coords}
				/>
			</div >

		)
	}
}

interface CollapsableAreaState {
	isActive: boolean
}

class CollapsableArea extends React.Component<{}, CollapsableAreaState> {
	public toggle() {
		this.setState({
			isActive: !this.state.isActive
		})
	}

	constructor(props: Readonly<{}>) {
		super(props);
		this.state = {
			isActive: true
		}
	}

	public render() {
		return (
			<div className="container">
				<div className="container--toggle"
					onClick={() => this.toggle()}
				>{this.state.isActive ? '▼' : '►'}</div>

				{this.state.isActive ? this.props.children : ''}
			</div>
		)
	}
}

const items: BehaviorSubject<VocabularyItem[]> = new BehaviorSubject([] as VocabularyItem[]);

items.next([
	{
		original: {
			infinitiv: "parler",
			je: "parle"
		},
		translation: "to speak"
	},
	{
		original: "devoir",
		translation: "to have to",
	},
	{
		original: "être",
		translation: "to be",
	},
	{
		original: "lire",
		translation: "to read",
	}
]);

const notificationAnimation = new Animation();
notificationAnimation.animationClasses = [
	{
		class: "notification",
		duration: 4000,
	}, {
		class: "notificationFadeOut",
		duration: 1200
	}
];
notificationAnimation.fallbackClass = "transparent";

interface AddNewWordState {
	french: FrenchVerb,
	english: string,
	animationClass: string
}

class AddNewWordDialog extends React.Component<{}, AddNewWordState> {

	constructor(props: EmptyProps) {
		super(props);
		this.state = {
			french: {},
			english: "",
			animationClass: notificationAnimation.fallbackClass
		}
	}

	public setEnglishWord(word: string) {
		this.setState({
			english: word
		})
	}

	public setFrenchWord(word: string, key: string) {
		this.setState({
			french: {
				...this.state.french,
				[key]: word
			}
		})
	}

	public saveWord() {
		if (frenchVerbKeys.filter(key => !!this.state.french[key]).length && this.state.english !== '') {
			items.pipe(first()).subscribe((currentItems) => {
				if (!currentItems.find(item => item.original === this.state.french || item.translation === this.state.english)) {
					currentItems.push({
						original: this.state.french,
						translation: this.state.english
					});
					items.next(currentItems);
				} else {
					notificationAnimation.stopAnimation();
					notificationAnimation.getAnimation().subscribe((animationClass) => {
						this.setState({
							animationClass: animationClass
						})
					})
				}
			})

		}
	}

	render() {
		return (
			<div>
				<h2>Add new word</h2>
				<div className="flex">
					<div>
						{frenchVerbKeys.map((key) => (
							<div className="inputWithHint">
								<div className="hint">{key}</div>
								<input onChange={(event) => this.setFrenchWord(event.target.value, key)} />
							</div>
						)
						)}

					</div>
					<div className="inputWithHint">
						<div className="hint">English</div>
						<input onChange={(event) => this.setEnglishWord(event.target.value)} />
					</div>
				</div>

				<div className="flex">
					<button className="defaultButton"
						onClick={() => this.saveWord()}>Save</button>
					<div className={this.state.animationClass}>This word is already in vocabulary</div>
				</div>
			</div >
		)
	}
}

function App() {
	return (
		<div className="App">
			<div>
				<VocabularyTrainer items={items} />
				<div>fuck you</div>
				{
					[
						(<div>1</div>),
						(<div>2</div>),
					]
				}
			</div>
			<AddNewWordDialog />
		</div>
	);
}

export default App;
