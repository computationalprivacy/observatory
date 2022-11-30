import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { scalePoint, scaleLog } from 'd3-scale';
import { range, shuffle } from 'd3-array';
import { json } from 'd3-fetch';
import moment from 'moment';

import { 
    Alert,
    Button,
    Col,
    Card,
    DatePicker,
    Divider,
    Menu,
    Modal,
    PageHeader,
    Popover,
    Progress,
    Row,
    Select,
    Statistic,
    Typography,
    Tag 
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
const { CheckableTag } = Tag;
const { Paragraph, Title } = Typography;
const { SubMenu } = Menu;

import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

import { Categorical, GaussianCopula } from '../model/distributions';
import { Model, IPerson } from './IndividualRiskPage';
import { Country } from '../App';
import { correctness_with_prob } from '../model/indiv_uniqueness';

export default class CountryReportsPage extends React.Component<
    RouteComponentProps,
    IState
> {
    personRadius = 2.5;
    listHeightCaches: CellMeasurerCache[] = [];

    constructor(props: RouteComponentProps) {
        super(props);
        this.state = {
            tooltipContent: '',
            continents: {},
            country: null,
            G: null,
            popNum: 0,
            attrs: [],
            attrMeans: [],
            attrUniqVals: [],
            hasAge: false,
            selectedHeaders: [],
            countryData: [],
            birthdate: null,
            correctness: 0,
            numSimPpl: 0,
            attrUniqValsMap: [],
            openKeys: [],
            openMenu: true,
            population: shuffle(this.createPopulation(110, 110, 200, 200)),
            isModalVisible: false,
        };
    }

    // read available countries & corresponding continent data from file
    componentDidMount(): void {
        json('/risk.json').then((data) => {
            const countryData = data as Country[];
            const continents: Record<string, Country[]> = {};

            for (const country of countryData) {
                if (country.continent in continents) {
                    continents[country.continent].push(country);
                } else {
                    continents[country.continent] = [country];
                }
            }

            for (const continent in continents) {
                continents[continent] = continents[continent].sort((a, b) => a.name.localeCompare(b.name));
            }

            this.setState({
                countryData: countryData,
                continents: continents,
            });

            if (this.props.location.state != null) {
				const auxData = (this.props.location.state as { attrs: number[], birthdate: string });
                const attrs = auxData.attrs; 
				const birthdate = auxData.birthdate === '' ? null : moment(auxData.birthdate, 'YYYY-MM-DD');
                const countryIndex = attrs.shift();
                this.chooseCountry(undefined, countryIndex, attrs, birthdate);
            } else {
                this.chooseCountry('GBR');
            }
        });
    }

    // when a country is selected, read the model file and load it into state
    chooseCountry = (
        iso3?: string,
        countryIndex?: number,
        attrs?: number[],
		birthdate?: moment.Moment
    ): void => {
        let country: Country = null;
        if (iso3 != null) {
            country = this.state.countryData.find(
                (country) => country.iso3 === iso3
            );
        } else {
            country = this.state.countryData[countryIndex];
            iso3 = country.iso3;
        }

        const load_attrs = (attrs == undefined);
        if (attrs == undefined) {
            attrs = [];
        }

        json(`/country_models/${iso3}.json`).then((data) => {
            const model = data as Model;

            // necessary variables for UniquenessData component
            const marginals: Categorical[] = [];
            const attrUniqVals: string[][] = [];
            const attrMeans: number[] = [];
            const selectedHeaders: string[] = model.avail_var;

            // extract variables from model file
            for (const header of selectedHeaders) {
                const marginal = model.marginals[header];
                const uniqVals = marginal.uniqVals;
                const categorical = new Categorical(marginal.probs);
                const mean = categorical.invMeanPdf();

                attrUniqVals.push(uniqVals);
                marginals.push(categorical);
                attrMeans.push(mean);

                if (load_attrs) {
                    attrs.push(Number.NaN);
                    // start with mean values selected for random attributes
                    /* const randInt = Math.floor(Math.random() * 2);
                    if (randInt == 1 && header !== "Age") {
                        attrs.push(mean);
                    } else {
                        attrs.push(Number.NaN);
                    }*/
                }
            }

            const G = new GaussianCopula(model.corr, marginals);
            const attrUniqValsMap = attrUniqVals.map((uniqVals, index, _) => {
                let mappedUniqVals = uniqVals.map(
                    (val, index, _) => [val, index] as [string, number]
                );

                if (!isNaN(parseInt(uniqVals[0]))) {
                    // numerical
                    // longer str < smaller str
                    // sort same length strings usually
                    mappedUniqVals = mappedUniqVals.sort(
                        (a, b) => a[0].length == b[0].length ? a[0].toString().localeCompare(b[0].toString()) : a[0].length - b[0].length
                    )
                } else {
                    mappedUniqVals = mappedUniqVals.sort((a, b) =>
                        a[0].localeCompare(b[0])
                    );
                }
    
                this.listHeightCaches.push(
                    new CellMeasurerCache({ fixedWidth: true, defaultHeight: 40 })
                );
    
                return mappedUniqVals;
            });

            this.setState({
                openMenu: false,
                country: country,
                G: G,
                popNum: model.pop_num,
                numSimPpl: model.pop_num,
                attrUniqVals: attrUniqVals,
                attrMeans: attrMeans,
                attrs: attrs,
                hasAge: selectedHeaders.includes("Age"),
                selectedHeaders: selectedHeaders,
                birthdate: birthdate,
                attrUniqValsMap: attrUniqValsMap,
                isModalVisible: false
            });
            this.updateCorrectness(true);
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
    birthdateSelected = (date: moment.Moment, _: string): void => {
        const headerIndex = this.state.selectedHeaders.findIndex((header) => header === "Age");
        const attrUniqValsMap = this.state.attrUniqValsMap[headerIndex];
		let ageIndex = 0;
        if (date == null) {
            // if close button is clicked, set ageIndex = NaN 
			ageIndex = Number.NaN;
        } else {
            const age = new Date().getFullYear() - date.year();
            const ageVal = attrUniqValsMap.find(([ageStr, _]) => parseInt(ageStr) === age);
            if (ageVal == null) {
                let lowestDiff = Math.abs(parseInt(attrUniqValsMap[0][0]) - age);
				ageIndex = 0;
                attrUniqValsMap.forEach(([ageStr, index]) => {
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
        if (this.state.hasAge) {
            // if AGE is present and chosen, then scale the age probability by
            // 1 / 365 (to reduce age values to date values)
            const ageIndex = this.state.selectedHeaders.findIndex(
                (attr) => attr === "Age"
            );
            if (ageIndex !== -1) {
                scaleProb = this.state.attrs.map((_) => 1);
                scaleProb[ageIndex] = 1 / 365;
            }
        }

        let indiv = this.state.attrs;
        indiv = indiv.map(val => val == -1 ? Number.NaN : val);

        const [_, probDrawing] = correctness_with_prob(
            this.state.G,
            indiv,
            this.state.popNum,
            scaleProb
        );

        let numSimPpl = Math.round(probDrawing * this.state.popNum);
        numSimPpl = numSimPpl == 0 ? 1 : numSimPpl;
        const correctness = (1 / numSimPpl) * 100;

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

        if (setState) {
            this.setState({
                correctness: correctness,
                numSimPpl: numSimPpl,
                attrs: this.state.attrs,
                population: new_population,
            });
        }

        return [correctness, numSimPpl];
    }

    truncateString(str: string, length: number): string {
        str = str.toString();
        return str.length <= length ? str : str.substr(0, length) + '...';
    }

    // returns actual value of attribute (not index used by model)
    getAttrValue(index: number): string {
        if (!isNaN(this.state.attrs[index])) {
            const uniqVals = this.state.attrUniqVals[index];
            const valIndex = this.state.attrs[index];
            const val = this.truncateString(uniqVals[valIndex], 10);

            return ': ' + val;
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
        const state = this.state;
        
        const CountryChooser = (
            <div style={{ minWidth: '75%' }}>
                <Modal title="Select a country to begin!"
                       visible={state.isModalVisible}
                       onOk={(_) => this.setState({isModalVisible: false})}
                       onCancel={(_) => this.setState({isModalVisible: false})}>
                    <Menu
                        onClick={(e) => this.chooseCountry(e.key.toString())}
                        openKeys={state.openMenu ? state.openKeys : []}
                        onOpenChange={(openKeys: React.ReactText[]) => this.setState({openKeys: openKeys.map(text => text.toString())})}
                        mode="inline">
                        {Object.keys(state.continents).sort((a, b) => a.localeCompare(b)).map(
                            (continent, index, _) => (
                                <SubMenu key={index} title={continent} onTitleClick={(_) => this.setState({openMenu: true})}>
                                    {state.continents[continent].map((country) => (
                                        <Menu.Item key={country.iso3}>
                                            {country.name}
                                        </Menu.Item>
                                    ))}
                                </SubMenu>
                            )
                        )}
                    </Menu>
                </Modal>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                    <Button type="primary" onClick={(_) => this.setState({isModalVisible: true})}>Select another country</Button>
                </div>
                <Divider />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                    {state.selectedHeaders.map((header, hindex, _) => (
                        state.hasAge && header === "Age" ?
                        <DatePicker
                            onChange={this.birthdateSelected}
                            value={state.birthdate}
                            placeholder={'Select birthdate'}
                            defaultPickerValue={moment('01-01-1990', 'DD-MM-YYYY')}
                            bordered={state.birthdate != null}
                            style={{
                                marginBottom: '15px',
                                marginRight: '15px',
                                width: '200px',
                            }}
                        /> :
                        <Select
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }

                            onChange={(val) => {
                                const attrs = state.attrs;
                                attrs[hindex] = val;

                                this.setState(
                                    {
                                        attrs: attrs,
                                    },
                                    () => this.updateCorrectness()
                                );
                            }}
                            value={state.attrs[hindex] >= 0 ? state.attrs[hindex] : -1}

                            bordered={state.attrs[hindex] > -1}
                            dropdownMatchSelectWidth={false}
                            className="dashboard-form-select"
                            >
                                <Select.Option key={-1} value={-1} style={{ color: 'LIGHTGRAY' }}>
                                    {header}
                                </Select.Option>
                                {state.attrUniqValsMap[hindex].map((val, index2, _) => (
                                    <Select.Option
                                        key={index2}
                                        value={val[1]}>
                                        {val[0]}
                                    </Select.Option>
                                ))}
                        </Select>
                    ))}
                </div>
            </div>
        );

        const CountryView = state.country ? (
            <div>
                <PageHeader
                    style={{
                        margin: 0,
                        padding: '0px 0px 20px 0px',
                    }}
                    title={state.country.name}
                />
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
                        </Paragraph>}
                        type="info"
                        showIcon
                    />
                </div>
            </div>
        ) : null;

        const Description = !state.country ? (
            <Title level={4} style={{ textAlign: 'center' }}>
                View country level correctness data here and compare correctness
                between countries.
            </Title>
        ) : null;

        return (
            <Row className="row-100vh">
                <Col
                    className="left-half"
                    xs={24}
                    sm={24}
                    md={12}
                    lg={12}
                    style={{
                        display: 'grid',
                        placeItems: 'center',
                        overflowY: 'auto',
                    }}>
                    {CountryChooser}
                </Col>
                <Col className="right-half" xs={24} sm={24} md={12} lg={12}>
                    <Card
                        style={{
                            height: '100%',
                            overflowY: 'auto',
                            display: 'grid',
                            placeItems: 'center',
                        }}>
                        {Description}
                        {CountryView}
                    </Card>
                </Col>
            </Row>
        );
    }
}

interface IState {
    continents: Record<string, Country[]>;
    tooltipContent: string;
    country: Country;
    countryData: Country[];
    G: GaussianCopula;
    popNum: number;
    attrs: number[];
    attrMeans: number[];
    attrUniqVals: string[][];
    attrUniqValsMap: [string, number][][];
    hasAge: boolean;
    selectedHeaders: string[];
    birthdate: moment.Moment;
    correctness: number;
    numSimPpl: number;
    openKeys: string[];
    openMenu: boolean;
    population: IPerson[];
    isModalVisible: boolean;
}
