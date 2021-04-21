import React from 'react';
import { Button, Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
const { Paragraph, Text, Title } = Typography;
const { CheckableTag } = Tag;

import { scalePoint, scaleLog } from 'd3-scale';
import { range, shuffle } from 'd3-array';

import ResizeObserver from 'react-resize-observer';

export default class MainPage extends React.Component<unknown, IState> {
    personRadius = 2.5;
    mounted = false;

    constructor(props: unknown) {
        super(props);

        // chosen individual for simulation
        const default_indiv = [
            {
                desc: 'United Kingdom',
                active: true,
                probDrawing: 0,
                text: ' people live in the United Kingdom',
            },
            {
                desc: 'London',
                active: false,
                probDrawing: 0.12147814648567286,
                text: ' people in the United Kingdom, live in London',
            },
            {
                desc: '12-08-1987',
                index: '14',
                active: false,
                probDrawing: 0.00007449965102412603,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997 ',
            },
            {
                desc: 'Male',
                active: false,
                probDrawing: 0.0000390260887166688,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997, are males ',
            },
            {
                desc: 'Married',
                active: false,
                probDrawing: 0.00001601197488790827,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997, are males, are married ',
            },
            {
                desc: 'Christian',
                active: false,
                probDrawing: 0.000008353774533695712,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997, are males, are married, are Christian ',
            },
            {
                desc: 'Indian',
                active: false,
                probDrawing: 3.3849194560309624e-8,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997, are males, are married, are Christian, are Indian ',
            },
            {
                desc: 'Unemployed',
                active: false,
                probDrawing: 3.188717957065461e-9,
                text:
                    ' people in the United Kingdom, live in London, are born on 12-08-1997, are males, are married, are Christian, are Indian, and currently unemployed.',
            },
        ];

        this.state = {
            indiv: [...default_indiv],
            numSimPpl: 66650000, // UK population
            popNum: 66650000, // UK population
            population: shuffle(this.createPopulation(280, 120, 540, 220)),
            attrIndex: 1,
        };
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

        // color first numColoredDots dots in randomly shuffled population
        const new_population = this.state.population;
        for (let i = 0; i < new_population.length; i++) {
            new_population[i].simAttr = i < numColoredDots;
        }

        this.setState({
            population: new_population,
        });

        return numSimPpl;
    }

    // reset simulation
    resetAttrs(): void {
        // reset all attrs to be inactive
        for (const attr of this.state.indiv) {
            attr.active = false;
        }

        // except for United Kingdom
        this.state.indiv[0].active = true;

        this.state.population.forEach((p) => (p.simAttr = true));

        this.setState({
            indiv: this.state.indiv,
            numSimPpl: 66650000,
            popNum: 66650000,
            population: this.state.population,
            attrIndex: 1,
        });

        // advance simulation 1s later
        const revealNextAttr = this.revealNextAttr.bind(this);
        setTimeout(revealNextAttr, 2000);
    }

    // show number of similar people with next attribute included
    // i.e. advance simulation by one step
    revealNextAttr(): void {
        if (!this.mounted) {
            return;
        }

        // reset simulation if last attribute had been reached
        if (this.state.attrIndex == this.state.indiv.length) {
            const resetAttrs = this.resetAttrs.bind(this);
            setTimeout(resetAttrs, 5000);
            return;
        }

        const attrIndex = this.state.attrIndex;
        const indiv = this.state.indiv;
        const probDrawing = indiv[attrIndex].probDrawing;

        // get new number of similar people and show next attribute by making it
        // active
        const numSimPpl = this.getSimPpl(probDrawing);
        indiv[attrIndex].active = true;

        this.setState({
            indiv: indiv,
            numSimPpl: numSimPpl,
            attrIndex: attrIndex + 1,
        });

        // advance simulation 1s later
        const revealNextAttr = this.revealNextAttr.bind(this);
        setTimeout(revealNextAttr, 2000);
    }

    componentDidMount(): void {
        this.mounted = true;

        // start simulation
        const revealNextAttr = this.revealNextAttr.bind(this);
        setTimeout(revealNextAttr, 500);
    }

    componentWillUnmount(): void {
        this.mounted = false;
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

    // person object for risk visualization
    Person = (person: IPerson): JSX.Element => {
        let fillColor = '#EB913D';

        if (person.simAttr) {
            fillColor = '#ffffff';
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
        const N = 30;
        const xScale = scalePoint<number>()
            .domain(range(0, N))
            .range([
                cx - width / 2 + this.personRadius,
                cx + width / 2 - this.personRadius,
            ]);

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
            .range([
                cy - height / 2 + this.personRadius,
                cy + height / 2 - this.personRadius,
            ]);

        const rows = range(0, M).map((i) =>
            this.createRow(cx, yScale(i), width)
        );

        return rows.reduce((population, row) => [...population, ...row]);
    };

    render(): React.ReactNode {
        const state = this.state;
        return (
            <Row className="row-full-h-bleed row-100vh" justify="center">
                <Col
                    className="left-half"
                    lg={12}
                    xs={24}
                    style={{ display: 'grid', placeItems: 'center' }}>
                    <div className="contrast-paragraph">
                        <Title level={3}>
                            “We might share anonymous data with third parties”
                        </Title>
                        <Paragraph>
                            If you ever read privacy policies online, you have 
                            probably seen this sentence before. Is your data truly anonymous and is your information safe? Could a few pieces of information be used to re-identify you?<br /><br />
                            
                            Welcome to the Observatory of Anonymity, an interactive website to explore the research of the Computational Privacy Group at Imperial College London. Take a short quiz to find out what makes you more vulnerable to re-identification, explore anonymity in 89 countries around the world, or train our method with your own datasets.
                        </Paragraph>
                        <Link to="/observatory/take-the-quiz">
                            <Button type="primary">Try for yourself</Button>
                        </Link>
                    </div>
                </Col>
                <Col className="right-half contrast-half" lg={12} xs={24}>
                    <Card
                        style={{ height: '100%', overflowY: 'auto' }}
                        bodyStyle={{
                            height: '100%',
                            display: 'grid',
                            placeItems: 'center',
                        }}>
                        <div style={{ width: '80%' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '240px',
                                    display: 'grid',
                                    placeItems: 'center',
                                    marginBottom: '10px',
                                }}>
                                <ResizeObserver
                                    onResize={(rect) => {
                                        this.setState({
                                            population: shuffle(
                                                this.createPopulation(
                                                    rect.width / 2,
                                                    rect.height / 2,
                                                    rect.width,
                                                    rect.height
                                                )
                                            ),
                                        });
                                    }}
                                />
                                <svg
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}>
                                    {state.population.map((p, index, _) => (
                                        <this.Person key={index} {...p} />
                                    ))}
                                </svg>
                            </div>
                            <Paragraph className="mock-statistic">
                                <span className="valueText">
                                    {this.formatNumber(state.numSimPpl)}
                                </span>
                                <span className="suffixText">
                                    {` out of ${this.formatNumber(
                                        state.popNum
                                    )}`}
                                    {state.indiv[state.attrIndex - 1].text}
                                </span>
                            </Paragraph>
                        </div>
                    </Card>
                </Col>
            </Row>
        );
    }
}

interface IState {
    indiv: {
        desc: string;
        probDrawing: number;
        active: boolean;
        text: string;
    }[];
    numSimPpl: number;
    population: IPerson[];
    popNum: number;
    attrIndex: number;
}

interface IPerson {
    x: number;
    y: number;
    simAttr: boolean;
}
