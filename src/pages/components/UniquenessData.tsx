import React from 'react';
import {
    Alert,
    Button,
    Card,
	DatePicker,
    Popover,
    Progress,
    Statistic,
    Tag,
    Typography,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
const { Text } = Typography;
const { CheckableTag } = Tag;

import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

import * as dayjs from 'dayjs';
dayjs().format();

import { GaussianCopula } from '../../model/distributions';
import { correctness_with_prob } from '../../model/indiv_uniqueness';

export default class UniquenessData extends React.Component<IProps, IState> {
    listHeightCaches: CellMeasurerCache[] = [];

    constructor(props: IProps) {
        super(props);
        this.state = {
            attrs: props.attrs,
            correctness: 0,
            attrUniqVals: [],
            numSimPpl: 0,
			birthdate: props.birthdate 
        };

        const [correctness, numSimPpl] = this.updateCorrectness(false);
        const allUniqVals = props.attrUniqVals.map((uniqVals) => {
            let mappedUniqVals = uniqVals.map(
                (val, index, _) => [val, index] as [string, number]
            );

            // longer str < smaller str
            // sort same length strings usually
            mappedUniqVals = mappedUniqVals.sort(
                (a, b) => a[0].length == b[0].length ? a[0].localeCompare(b[0]) : a[0].length - b[0].length
            )

            this.listHeightCaches.push(
                new CellMeasurerCache({ fixedWidth: true, defaultHeight: 40 })
            );

            return mappedUniqVals;
        });

        this.state = {
            attrs: props.attrs,
            correctness: correctness,
            attrUniqVals: allUniqVals,
            numSimPpl: numSimPpl,
			birthdate: props.birthdate
        };
    }

    // when birthdate is selected, choose the closest age that is present
    // (if that particular age is not present in country's dataset)
    birthdateSelected = (date: dayjs.Dayjs, _: string): void => {
        const headerIndex = this.props.selectedHeaders.findIndex((header) => header === "Age");
        const attrUniqVals = this.state.attrUniqVals[headerIndex];
		let ageIndex = 0;
        if (date == null) {
            // if close button is clicked, set ageIndex = NaN 
			ageIndex = Number.NaN;
        } else {
            const age = new Date().getFullYear() - date.year();
            const ageVal = attrUniqVals.find(([ageStr, _]) => parseInt(ageStr) === age);
            if (ageVal == null) {
                let lowestDiff = Math.abs(parseInt(attrUniqVals[0][0]) - age);
				ageIndex = 0;
                attrUniqVals.forEach(([ageStr, index]) => {
                    const currDiff = Math.abs(parseInt(ageStr) - age);
                    if (currDiff < lowestDiff) {
                        lowestDiff = currDiff;
						ageIndex = index;
                    }
                });
			} else {
				ageIndex = ageVal[1];
			}
        }

        const attrs = this.state.attrs;
        attrs[headerIndex] = ageIndex;

        this.setState(
            {
                attrs: attrs,
                birthdate: date,
            },
            () => this.updateCorrectness()
        );
    };

    // get random record from dataset and convert it to index values used be
    // model
    getRandRecord = (): void => {
        const strVals = this.props.randRecord();
        strVals.forEach((val, index, _) => {
            const [matchVal, matchIndex] = this.state.attrUniqVals[index].find(
                ([matchVal, _]) => matchVal === val
            );
            this.state.attrs[index] = matchIndex;
        });

        this.updateCorrectness();
    };

    // format number in millions and billions
    formatNumber(n: number): string {
        const M = 1000000;
        const B = 1000 * M;
        if (n >= B) {
            return `${(n / B).toFixed(1)}B`;
        } else if (n >= M) {
            return `${(n / M).toFixed(1)}M`;
        } else {
            return n <= 1 ? '1' : `${n}`;
        }
    }

    // recalculate correctness in response to attrs changed
    // optionally update the state with the changed attrs
    updateCorrectness(setState = true): [number, number] {
        let scaleProb = null;
        if (this.props.hasAge) {
            // if AGE is present and chosen, then scale the age probability by
            // 1 / 365 (to reduce age values to date values)
            const ageIndex = this.props.selectedHeaders.findIndex(
                (attr) => attr === "Age"
            );
            if (ageIndex !== -1) {
                scaleProb = this.state.attrs.map((_) => 1);
                scaleProb[ageIndex] = 1 / 365;
            }
        }
        const [_, probDrawing] = correctness_with_prob(
            this.props.G,
            this.state.attrs,
            this.props.N,
            scaleProb
        );

        let numSimAttr = Math.round(probDrawing * this.props.N);
        numSimAttr = numSimAttr == 0 ? 1 : numSimAttr;
        const correctness = (1 / numSimAttr) * 100;

        if (setState) {
            this.setState({
                correctness: correctness,
                numSimPpl: numSimAttr,
                attrs: this.state.attrs,
            });
        }

        return [correctness, numSimAttr];
    }

    truncateString(str: string, length: number): string {
        str = str.toString();
        return str.length <= length ? str : str.substr(0, length) + '...';
    }

    // returns actual value of attribute (not index used by model)
    getAttrValue(index: number): string {
        if (!isNaN(this.state.attrs[index])) {
            const uniqVals = this.props.attrUniqVals[index];
            const valIndex = this.state.attrs[index];
            const val = this.truncateString(uniqVals[valIndex], 10);

            return ':' + val;
        }

        return '';
    }

	// returns birthdate value formatted
	getBirthdateValue(): string {
		if (this.state.birthdate != null) {
			return ':' + this.state.birthdate.format('YYYY-MM-DD');
		}

		return '';
	}

    render(): React.ReactNode {
        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                    {this.props.selectedHeaders.map((header, hindex, _) => (
                        <Popover
                            key={hindex}
                            placement="bottom"
                            content={
								this.props.hasAge && header === "Age" ? 
								<DatePicker 
									onChange={this.birthdateSelected}
									value={this.state.birthdate} /> :
								<List
                                    rowCount={
                                        this.state.attrUniqVals[hindex].length
                                    }
                                    width={200}
                                    height={200}
                                    overscanRowCount={5}
                                    deferredMeasurementCache={
                                        this.listHeightCaches[hindex]
                                    }
                                    rowHeight={
                                        this.listHeightCaches[hindex].rowHeight
                                    }
                                    rowRenderer={({
                                        index,
                                        parent,
                                        key,
                                        style,
                                    }) => (
                                        <CellMeasurer
                                            key={key}
                                            cache={
                                                this.listHeightCaches[hindex]
                                            }
                                            parent={parent}
                                            columnIndex={0}
                                            rowIndex={index}>
                                            <div style={style}>
                                                <div
                                                    className="virtualized-list-item"
                                                    style={{
                                                        cursor: 'pointer',
                                                        marginBottom: '20px',
                                                    }}
                                                    onClick={() => {
                                                        this.state.attrs[
                                                            hindex
                                                        ] = this.state.attrUniqVals[
                                                            hindex
                                                        ][index][1];
                                                        this.updateCorrectness();
                                                    }}>
                                                    {
                                                        this.state.attrUniqVals[
                                                            hindex
                                                        ][index][0]
                                                    }
                                                </div>
                                            </div>
                                        </CellMeasurer>
                                    )}
                                />
                            }>
                            <CheckableTag
                                checked={!isNaN(this.state.attrs[hindex])}
                                style={{ marginBottom: 10 }}
                                onClick={() => {
                                    if (!isNaN(this.state.attrs[hindex])) {
                                        this.state.attrs[hindex] = Number.NaN;
                                        this.updateCorrectness();
                                    }
                                }}>
									{this.props.hasAge && header === "Age"
										? 'Birthdate' + this.getBirthdateValue()
										: header + this.getAttrValue(hindex)}{' '}
                                <DownOutlined />
                            </CheckableTag>
                        </Popover>
                    ))}
                </div>
                <br />
                <Card>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <Statistic
                            style={{ flexGrow: 1 / 2, padding: '5px' }}
                            title="Number of people that share these attributes"
                            value={this.formatNumber(this.state.numSimPpl)}
                            suffix={`out of ${this.formatNumber(this.props.N)}`}
                        />
                        <div style={{ flexGrow: 1 / 2, padding: '5px' }}>
                            <Statistic
                                title="Likelihood of being correctly re-identified"
                                value={Math.floor(this.state.correctness)}
                                suffix="%"
                            />
                            <Progress
                                percent={this.state.correctness}
                                status={
                                    this.state.correctness > 69.5
                                        ? 'exception'
                                        : 'success'
                                }
                                showInfo={false}
                            />
                        </div>
                    </div>
                </Card>
                <Alert
                    style={{ marginTop: '20px' }}
                    message="How do I use this?"
                    description={
                        <Text>
                            Did you find a record that matches someone you know? Select
                            the attributes of that person to calculate the
                            likelihood that the record actually belongs to the
                            person you know (<i>a correctly re-identification</i>).
                            <br />
                            {this.props.randRecord != null ? (
                                <span>
                                    You can also click{' '}
                                    <Button
                                        style={{
                                            padding: '0px',
                                            margin: '0px',
                                        }}
                                        onClick={this.getRandRecord}
                                        type="link">
                                        select an individual at random
                                    </Button>{' '}
                                     from the dataset.
                                </span>
                            ) : null}
                        </Text>
                    }
                    type="info"
                    showIcon
                />
            </div>
        );
    }
}

interface IState {
    attrs: number[];
    correctness: number;
    numSimPpl: number;
    attrUniqVals: [string, number][][];
	birthdate: dayjs.Dayjs;
}

interface IProps {
    attrs: number[];
    attrMeans: number[];
    attrUniqVals: string[][];
    selectedHeaders: string[];
    N: number;
    G: GaussianCopula;
    randRecord: () => string[];
    hasAge: boolean;
	birthdate: dayjs.Dayjs;
}
