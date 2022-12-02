import React from 'react';
import Animate from 'rc-animate';
import ReactTooltip from 'react-tooltip';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import * as dayjs from 'dayjs';
dayjs().format();

import {
    Alert,
    AutoComplete,
    Button,
    Card,
    Col,
    DatePicker,
    Progress,
    Row,
    Select,
    Steps,
    Tag,
    Typography,
    Statistic,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
const { Paragraph, Text, Title } = Typography;
const { Step } = Steps;
const { CheckableTag } = Tag;

import { scalePoint, scaleLog } from 'd3-scale';
import { range, shuffle } from 'd3-array';
import { json } from 'd3-fetch';

import { Country } from '../App';
import { GaussianCopula, Categorical } from '../model/distributions';
import { correctness_with_prob } from '../model/indiv_uniqueness';
import RiskMap from './components/RiskMap';

import '../animate.css';

export default class IndividualRiskPage extends React.Component<
    RouteComponentProps,
    IState
> {
    personRadius = 2.5;
    origQns: Question[] = [];
    origAttrs: number[] = [];

    constructor(props: RouteComponentProps) {
        super(props);

        this.state = {
            qnNum: 0,
            qns: [],
            G: null,
            correctness: 0,
            numSimPpl: 0,
            population: shuffle(this.createPopulation(110, 110, 200, 200)),
            popNum: 0,
            attrs: [],
            // a copy of attrs is required so that attributes can be
            // turned "off" and "on"
            attrsCopy: [],
            countryData: [],
            selectedHeaders: [],
            birthdate: null,
            redirect: false,
            tooltipContent: '',
        };
    }

    // when country is chosen, load country model
    loadCountryModel(): void {
        const country_index = this.state.attrs[0];
        const country = this.state.countryData[country_index];
        json(`/country_models/${country.iso3}.json`).then((data) => {
            const model = data as Model;
            const selectedHeaders = model.avail_var;
            selectedHeaders.push('COUNTRY');
            const newQns: Question[] = this.origQns.filter((qn) =>
                selectedHeaders.includes(qn.title)
            );

            const marginals: Categorical[] = [];
            // load questions relevant to the variables present in this
            // country's model
            for (const qn of newQns) {
                if (qn.title !== 'COUNTRY') {
                    const marginal = model.marginals[qn.title];
                    const uniqVals = marginal.uniqVals;

                    let vals: QuestionVal[] = [];
                    uniqVals.forEach((val, index, _) => {
                        vals.push({ value: val.toString(), index: index });
                    });

                    if (!isNaN(parseInt(vals[0].value))) {
                        // numerical
                        // longer str < smaller str
                        // sort same length strings usually
                        vals = vals.sort(
                            (a, b) => a.value.length == b.value.length ? a.value.localeCompare(b.value) : a.value.length - b.value.length
                        )
                    } else {
                        // location sort by first letter
                        vals = vals.sort((a, b) => a.value.localeCompare(b.value));
                    }

                    qn.values = vals;

                    marginals.push(new Categorical(marginal.probs));
                }
            }

            // restrict length of attributes to relevant questions
            const attrs = new Array<number>(newQns.length);
            // preserve country chosen in new attributes array
            attrs[0] = this.state.attrs[0];
            for (let i = 1; i < attrs.length; i++) {
                attrs[i] = -1;
            }

            const G = new GaussianCopula(model.corr, marginals);
            this.setState({
                qnNum: this.state.qnNum + 1,
                qns: newQns,
                G: G,
                popNum: model.pop_num,
                numSimPpl: model.pop_num,
                correctness: 0,
                attrs: attrs,
                attrsCopy: [...attrs],
                selectedHeaders: selectedHeaders,
                birthdate: null,
            });
            this.updateCorrectness();
        });
    }

    // on component mount, read risk.json to get country name & iso3 data
    // if an iso3 was passed in through the url, pre-select the country
    componentDidMount(): void {
        // check if iso3 was passed in through url
        let countrySelected: string = null;
        if (this.props.match.params) {
            const params = this.props.match.params as { iso3: string };
            countrySelected = params.iso3;
        }

        json('/risk.json').then((data) => {
            const countryData = data as Country[];
            json('/qns.json').then((data) => {
                const qnData = data as Question[];

                // add choosing country to list of questions and sort by name
                countryData.forEach((country, index, _) => {
                    qnData[0].values.push({
                        value: country.name,
                        index: index,
                    });
                });
                qnData[0].values = qnData[0].values.sort((a, b) =>
                    a.value.localeCompare(b.value)
                );

                const attrs = new Array<number>(qnData.length);
                // country chosen defaults to 0
                attrs[0] = 0;
                if (countrySelected) {
                    // if country has been previously chosen
                    // (e.g. from CountryReportsPage) then chosen country
                    // defaults to that instead
                    const country = countryData.find(
                        (country) => country.iso3 == countrySelected
                    );

                    if (country) {
                        const index = qnData[0].values.find(
                            (val) => val.value === country.name
                        ).index;
                        attrs[0] = index;
                    }
                }

                // all other attributes are not chosen
                for (let i = 1; i < attrs.length; i++) {
                    attrs[i] = -1;
                }

                this.origQns = qnData;
                this.origAttrs = attrs;

                this.setState({
                    qns: qnData,
                    attrs: attrs,
                    attrsCopy: [...attrs],
                    countryData: countryData,
                });
            });
        });
    }

    // format numbers in millions and billions
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

    // respond to changes in selected attributes
    updateCorrectness(): void {
        if (this.state.qnNum > 0) {
            // recalculate correctness and number of people with similar attrs
            const probDrawing = this.getCorrectness()[1];
            const numSimPpl = this.getSimPpl(probDrawing);
            const correctness = (1 / numSimPpl) * 100;
            this.setState({
                correctness: correctness,
                numSimPpl: numSimPpl,
            });
        }
    }

    // reset state to restart quiz
    handleRestart = (): void => {
        this.setState({ redirect: true });
    };

    // get correctness from currently selected attrs
    getCorrectness(): [number, number] {
        if (this.state.qnNum > 0) {
            // remove chosen country attribute from individual
            // since country models are loaded separately
            let indiv = this.state.attrs.slice(1);
            indiv = indiv.map(val => val == -1 ? Number.NaN : val);

            // if AGE is present and chosen, then scale the age probability by
            // 1 / 365 (to reduce age values to date values)
            const ageIndex = this.state.selectedHeaders.findIndex(
                (attr) => attr === "Age"
            );
            let scaleProb = null;
            if (ageIndex !== -1) {
                scaleProb = indiv.map((_) => 1);
                scaleProb[ageIndex] = 1 / 365;
            }

            return correctness_with_prob(
                this.state.G,
                indiv,
                this.state.popNum,
                scaleProb
            );
        }

        return [0, 1];
    }

    // calculate the number of ppl with similar attributes based on
    // probability of drawing a record
    getSimPpl(probDrawing: number): number {
        let numSimPpl = Math.round(probDrawing * this.state.popNum);
        numSimPpl = numSimPpl == 0 ? 1 : numSimPpl;

        let numColoredDots = 0;
        if (numSimPpl <= 50) {
            // if there are less than 50 ppl, show as many dots
            numColoredDots = numSimPpl;
        } else {
            // else use a log scale to scale the number of ppl down
            const logScale = scaleLog()
                .domain([50, this.state.popNum])
                .range([50, 400]);
            numColoredDots = logScale(numSimPpl);
        }

        const new_population = this.state.population;
        for (let i = 0; i < new_population.length; i++) {
            new_population[i].simAttr = i < numColoredDots;
        }

        this.setState({
            population: new_population,
        });

        return numSimPpl;
    }

    // move onto next question
    onNext = (): void => {
        if (this.state.qnNum == 0) {
            // if current question is 0, country has been selected
            this.loadCountryModel();
        } else if (this.state.qnNum == this.state.qns.length - 1) {
            // last question reached restart the quiz
            this.handleRestart();
        } else {
            // when country has already been chosen, move onto next question
            this.setState({
                qnNum: this.state.qnNum + 1,
            });
        }
    };

    // go back to previous question
    onBack = (): void => {
        this.setState({
            qnNum: this.state.qnNum - 1,
        });
    };

    // person object for risk visualization
    Person = (person: IPerson): JSX.Element => {
        let fillColor = '#F0F2F5';

        if (person.simAttr) {
            fillColor = '#cc7722';
        }

        return (
            <circle
                cx={person.x}
                cy={person.y}
                r={this.personRadius}
                style={{ fill: fillColor }}></circle>
        );
    };

    // row of people for risk visualization
    createRow = (cx: number, cy: number, width: number): IPerson[] => {
        const N = 20;
        const xScale = scalePoint<number>()
            .domain(range(0, N))
            .range([cx - width / 2, cx + width / 2]);

        const row = range(0, N).map((i) => ({
            x: xScale(i),
            y: cy,
            simAttr: true,
        }));

        return row;
    };

    // matrix of people as population for risk visulation
    createPopulation = (
        cx: number,
        cy: number,
        width: number,
        height: number
    ): IPerson[] => {
        const M = 20;

        const yScale = scalePoint<number>()
            .domain(range(0, M))
            .range([cy - height / 2, cy + height / 2]);

        const rows = range(0, M).map((i) =>
            this.createRow(cx, yScale(i), width)
        );

        return rows.reduce((population, row) => [...population, ...row]);
    };

    // when birthdate is selected, choose the closest age that is present
    // (if that particular age is not present in country's dataset)
    birthdateSelected = (date: dayjs.Dayjs, _: string): void => {
        const qnIndex = this.state.qns.findIndex((qn) => qn.title === "Age");
        const qn = this.state.qns[qnIndex];
        let ageVal: QuestionVal = null;
        if (date == null) {
            // if close button is clicked, set ageVal index = -1
            ageVal = { value: '', index: -1 };
        } else {
            const age = new Date().getFullYear() - date.year();
            ageVal = qn.values.find((val) => parseInt(val.value) === age);
            if (ageVal == null) {
                let lowestDiff = Math.abs(parseInt(qn.values[0].value) - age);
                ageVal = qn.values[0];
                qn.values.forEach((val) => {
                    const currDiff = Math.abs(parseInt(val.value) - age);
                    if (currDiff < lowestDiff) {
                        lowestDiff = currDiff;
                        ageVal = val;
                    }
                });
            }
        }

        const attrs = this.state.attrs;
        const attrsCopy = this.state.attrsCopy;
        attrs[qnIndex] = ageVal.index;
        attrsCopy[qnIndex] = ageVal.index;

        this.setState(
            {
                attrs: attrs,
                attrsCopy: attrsCopy,
                birthdate: date,
            },
            () => this.updateCorrectness()
        );
    };

    render(): React.ReactNode {
        const state = this.state;
        if (state.redirect) {
            return (
                <Redirect
                    to={{
                        pathname: '/explore',
                        state: {
                            attrs: state.attrs.map((val) =>
                                val == -1 ? Number.NaN : val
                            ),
							birthdate: state.birthdate != null ? state.birthdate.format('YYYY-MM-DD') : ''
                        },
                    }}
                />
            );
        }

        // question with input shown on left
        const QnView = (qn: Question, index: number): JSX.Element => {
            return (
                <Animate
                    key={index}
                    transitionName="slide"
                    transitionAppear
                    transitionLeave={false}>
                    {state.qnNum == index ? (
                        <div>
                            <Title level={4}>
                                {qn.question}
                            </Title>
                            {qn.title === "Age" ? (
                                <DatePicker
                                    onChange={this.birthdateSelected}
                                    value={this.state.birthdate}
                                    placeholder={'Select birthdate'}
                                    defaultPickerValue={dayjs('01-01-1990', 'DD-MM-YYYY')}
                                    style={{
                                        marginBottom: '15px',
                                        width: '100%',
                                    }}
                                />
                            ) : (
                                <Select
                                    showSearch

                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }

                                    onChange={(val) => {
                                        const attrs = state.attrs;
                                        const attrsCopy = state.attrsCopy;
                                        attrs[index] = val;
                                        attrsCopy[index] = val;

                                        this.setState(
                                            {
                                                attrs: attrs,
                                                attrsCopy: attrsCopy,
                                            },
                                            () => this.updateCorrectness()
                                        );
                                    }}
                                    defaultValue={
                                        state.attrs[index] != -1
                                            ? state.attrs[index]
                                            : state.qnNum == 0
                                            ? 0
                                            : -1
                                    }
                                    style={{
                                        marginBottom: '15px',
                                        width: '100%',
                                    }}>
                                    {state.qnNum > 0 ? (
                                        <Select.Option key={-1} value={-1}>
                                            {' '}
                                        </Select.Option>
                                    ) : null}
                                    {qn.values.map((val, index2, _) => (
                                        <Select.Option
                                            key={index2}
                                            value={val.index}>
                                            {val.value}
                                        </Select.Option>
                                    ))}
                                </Select>
                            )}
                        </div>
                    ) : null}
                </Animate>
            );
        };

        // likelihood of re-identification bar (only shown in mobile devices)
        const MobileQuizRisk =
            state.qnNum > 0 ? (
                <div
                    className="mobile-quiz-risk"
                    style={{ marginBottom: '15px', width: '100%' }}>
                    <Text style={{ fontSize: '15px' }}>
                        Likelihood of being correctly re-identified: &nbsp;
                        <Tag color="#f40">{Math.floor(state.correctness)}%</Tag>
                    </Text>
                    <br />
                    <Progress
                        percent={state.correctness}
                        status={
                            state.correctness > 69.5 ? 'exception' : 'success'
                        }
                        showInfo={false}
                    />
                </div>
            ) : null;

        // checkable tag shown for each selected attr which can be clicked to
        // include & exclude attribute from correctness measurement
        const SelectedAttr = (qn: Question, index: number): JSX.Element => {
            return state.attrsCopy[index] != -1 ? (
                <CheckableTag
                    key={index}
                    checked={state.attrs[index] != -1}
                    style={{
                        marginRight: '10px',
                        marginBottom: '10px',
                    }}
                    onChange={(val) => {
                        if (index !== 0) {
                            const attrs = state.attrs;
                            const attrsCopy = state.attrsCopy;
                            if (val) {
                                attrs[index] = attrsCopy[index];
                            } else {
                                attrs[index] = -1;
                            }

                            this.setState(
                                {
                                    attrs: attrs,
                                },
                                () => this.updateCorrectness()
                            );
                        }
                    }}>
                    {qn.title === "Age"
                        ? 'Birthdate: ' + state.birthdate.format('YYYY-MM-DD')
                        : qn.title +
                          ': ' +
                          qn.values.find(
                              (val) => val.index === state.attrsCopy[index]
                          ).value}
                </CheckableTag>
            ) : null;
        };

        return (
            <Row className="row-100vh">
                <Col
                    className="left-half"
                    xs={24}
                    sm={24}
                    md={12}
                    lg={12}
                    style={{ display: 'flex' }}>
                    {state.qnNum != 0 ? (
                        <Steps
                            className="take-the-quiz-steps"
                            current={state.qnNum}
                            direction="vertical"
                            style={{ width: '46px', marginRight: '10px' }}>
                            {state.qns.map((_, index, __) => {
                                return index == state.qns.length - 1 ? (
                                    <Step
                                        data-tip={state.qns[index].title}
                                        key={index}
                                        style={{
                                            maxHeight: '35px',
                                            overflowY: 'hidden',
                                        }}
                                    />
                                ) : (
                                    <Step
                                        data-tip={state.qns[index].title}
                                        key={index}
                                    />
                                );
                            })}
                            <ReactTooltip />
                        </Steps> ) : null}
                    <div
                        style={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                        <div className="mobile-quiz-risk">
                            {state.qns.map((qn, index, _) => SelectedAttr(qn, index))}
                        </div>
                        <br />
                        <br />
                        {state.qns.map((qn, index, _) => QnView(qn, index))}
                        {MobileQuizRisk}
                        <div className='quiz-buttons'>
                            {state.qnNum > 0 ? (
                                <Button
                                    key="back"
                                    onClick={this.onBack}
                                    style={{
                                        flexGrow: 1,
                                        margin: '5px',
                                    }}>
                                    <LeftOutlined />
                                </Button>
                            ) : null}
                            <Button
                                key="next"
                                type="primary"
                                onClick={this.onNext}
                                style={{ flexGrow: 1, margin: '5px' }}>
                                {state.qnNum === 0 ? (
                                    'Start!'
                                ) : state.qnNum < state.qns.length - 1 ? (
                                    <RightOutlined />
                                ) : (
                                    'Explore further countries and attributes'
                                )}
                            </Button>
                        </div>
                    </div>
                </Col>
                <Col className="right-half" xs={0} sm={0} md={12} lg={12}>
                    <Card
                        style={{ height: '100%', overflowY: 'auto' }}
                        bodyStyle={{
                            height: '100%',
                            display: 'grid',
                            placeItems: 'center',
                        }}>
                        {state.qnNum > 0 ? (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                    }}>
                                    <svg
                                        style={{
                                            flexGrow: 1,
                                            width: '220px',
                                            height: '220px',
                                        }}>
                                        {state.population.map((p, index, _) => (
                                            <this.Person key={index} {...p} />
                                        ))}
                                    </svg>
                                    <div
                                        style={{
                                            flexGrow: 1,
                                            verticalAlign: 'top',
                                            fontSize: '20px',
                                        }}>
                                        <Statistic
                                            title="Number of people that share these attributes"
                                            value={this.formatNumber(
                                                state.numSimPpl
                                            )}
                                            suffix={`out of ${this.formatNumber(
                                                state.popNum
                                            )}`}
                                        />
                                        {state.qns.map((qn, index, _) =>
                                            SelectedAttr(qn, index)
                                        )}
                                    </div>
                                </div>
                                <Statistic
                                    style={{ marginTop: '20px' }}
                                    title="Likelihood of being correctly re-identified"
                                    value={Math.floor(state.correctness)}
                                    suffix="%"
                                />
                                <Progress
                                    percent={state.correctness}
                                    status={
                                        state.correctness > 69.5
                                            ? 'exception'
                                            : 'success'
                                    }
                                    showInfo={false}
                                />
                                <Alert
                                    style={{ marginTop: '20px' }}
                                    message="What does this mean?"
                                    description={<Paragraph>
                                        If a record were to be found in any anonymous 
                                        dataset matching your attributes,
                                        there is a <Tag color="#f40">
                                            {Math.floor(state.correctness)}%
                                        </Tag>chance that this record actually
                                        belongs to you.
                                        <br /><br />
                                        This score estimates your risk of re-identification 
                                        using a simplified version of our method, running directly
                                        in your browser. The results may be less accurate than when using <a href="https://nature.com/articles/s41467-019-10933-3">our original method</a>.
                                        <br />
                                        We use samples from the <a href="https://international.ipums.org">IPUMS-International database</a> to train our statistical models. The measures to safeguard the privacy and confidentiality of individuals in the sample can introduce errors in the results.
                                    </Paragraph>}
                                    type="info"
                                    showIcon
                                />
                            </div>
                        ) : (
                            [
                                <RiskMap
                                    key={0}
                                    data={state.countryData}
                                    setTooltipContent={(content) =>
                                        this.setState({
                                            tooltipContent: content,
                                        })
                                    }
                                    countryClicked={(iso3) => {
                                        state.attrs[0] = state.countryData.findIndex(
                                            (country) => country.iso3 === iso3
                                        );
                                        this.setState(
                                            {
                                                attrs: state.attrs,
                                            },
                                            () => {
                                                this.onNext();
                                            }
                                        );
                                    }}
                                />,
                                <ReactTooltip key={1}>
                                    {state.tooltipContent}
                                </ReactTooltip>,
                            ]
                        )}
                    </Card>
                </Col>
            </Row>
        );
    }
}

interface IState {
    qnNum: number;
    qns: Question[];
    G: GaussianCopula;
    correctness: number;
    numSimPpl: number;
    population: IPerson[];
    popNum: number;
    attrs: number[];
    attrsCopy: number[];
    countryData: Country[];
    selectedHeaders: string[];
    birthdate: dayjs.Dayjs;
    redirect: boolean;
    tooltipContent: string;
}

export interface IPerson {
    x: number;
    y: number;
    simAttr: boolean;
}

interface QuestionVal {
    value: string;
    index: number;
}

interface Question {
    question: string;
    title: string;
    values: QuestionVal[];
}

export interface Model {
    avail_var: string[];
    marginals: Record<string, { probs: number[]; uniqVals: string[] }>;
    pop_num: number;
    corr: number[][];
}
