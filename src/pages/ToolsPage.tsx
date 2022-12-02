import React from 'react';
import Papa from 'papaparse';

import {
    Button,
    Card,
    Checkbox,
    Col,
    Row,
    Spin,
    Steps,
    Progress,
    Typography,
} from 'antd';
import {
    UploadOutlined,
    DatabaseOutlined,
    SyncOutlined,
    LineChartOutlined,
} from '@ant-design/icons';
const { Paragraph, Title } = Typography;
const { Step } = Steps;

import ChooseDataset from './components/ChooseDataset';
import ChooseHeaders from './components/ChooseHeaders';
import UniquenessData from './components/UniquenessData';
import Worker from 'worker-loader!../worker';
import { Categorical, GaussianCopula } from '../model/distributions';

export default class ToolsPage extends React.Component<unknown, IState> {
    samplingPercentages: number[] = [];
    maxAttributes = 10;
    worker = new Worker();
    resetState: IState = {
        selectedFileName: 'No dataset chosen',
        fileUploadError: false,
        selectedSamplingPercentage: 100,
        numHeadersSelected: 100,
        selectedHeaders: new Set<string>(),
        dataset: [],
        dataset_headers: [],
        dataset_preview: [],
        currentPage: 0,
        G: null,
        popNum: 0,
        attrs: [],
        attrMeans: [],
        attrUniqVals: [],
        percentProgress: 0,
        eta: -1,
    };

    constructor(props: unknown) {
        super(props);

        // prepare sampling percentages 1, 5, 10, ..., 95, 100
        this.samplingPercentages.push(1);
        let startPercentage = 5;
        while (startPercentage <= 100) {
            this.samplingPercentages.push(startPercentage);
            startPercentage += 5;
        }

        this.state = { ...this.resetState };
        // prepare worker, listen for message event to be fired by worker
        this.worker.addEventListener('message', (e) => {
            if (e.data.type == 0) {
                // model has been successfully trained, extract required
                // variables from serialized JSON
                const rawG = e.data.G;
                const marginals = new Array<Categorical>(rawG.marginals.length);
                for (let i = 0; i < marginals.length; i++) {
                    marginals[i] = new Categorical(rawG.marginals[i].probs);
                }

                const G = new GaussianCopula(rawG.corr, marginals);
                const N = marginals.length;
                const popNum =
                    this.state.dataset.length *
                    this.state.selectedSamplingPercentage;

                // get mean values for each attribute
                const attrMeans: number[] = [];
                const attrs: number[] = [];

                for (let i = 0; i < N; i++) {
                    attrMeans.push(G.marginals[i].invMeanPdf());
                }

                for (let i = 0; i < N; i++) {
                    // choose mean for random attributes for initial view
                    const randInt = Math.floor(Math.random() * 2);
                    if (randInt == 1) {
                        attrs.push(attrMeans[i]);
                    } else {
                        attrs.push(Number.NaN);
                    }
                }

                this.setState({
                    currentPage: (this.state.currentPage + 1) % 4,
                    G: G,
                    popNum: popNum,
                    attrs: attrs,
                    attrMeans: attrMeans,
                });
            } else if (e.data.type == 1) {
                // update received on eta & percentage progress
                this.setState({
                    eta: Math.ceil(e.data.eta),
                    percentProgress: Math.floor(e.data.percent),
                });
            }
        });
    }

    // select a random record from the dataset
    randRecord = (): string[] => {
        const maxindex = this.state.dataset.length;
        if (maxindex > 0) {
            // only if dataset has been uploaded
            const rand = Math.floor(Math.random() * maxindex);
            const record = this.state.dataset[rand];
            const strRecord: string[] = [];
            this.state.selectedHeaders.forEach((header) => {
                strRecord.push(record[header]);
            });

            return strRecord;
        } else {
            return [''];
        }
    };

    // go to next stage : Import > Edit > Train > Explore
    nextPageClicked = (): void => {
        let currentPage = this.state.currentPage;
        switch (currentPage) {
            case 0:
                // when moving on from dataset selection page
                // check if dataset was successfully loaded
                if (this.state.dataset.length == 0) {
                    this.setState({
                        fileUploadError: true,
                    });
                    return;
                }
                break;
            case 1:
                // if moving on from header selection page increment page
                // to show progress circle and start processing
                currentPage += 1;
                this.setState({
                    currentPage: currentPage,
                });

                this.process_data();
                return;
            case 3:
                // if moving on from final page, reset state and start
                // from the first page
                this.setState({ ...this.resetState });
                return;
        }

        // default: increment the page
        this.setState({
            currentPage: (currentPage + 1) % 4,
        });
    };

    // remove selected rows from dataset
    removeRows<T>(data: T[], rows: number[]): T[] {
        const new_data = [];

        for (let i = 0; i < data.length; i++) {
            if (!rows.includes(i)) {
                new_data.push(data[i]);
            }
        }

        return new_data;
    }

    // load dataset and prepare preview data for ChooseHeaders page
    fileSelectedHandler = (
        event: React.ChangeEvent<HTMLInputElement>
    ): void => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target != null) {
                // parse csv from string

                const results = Papa.parse(e.target.result as string, {
                    header: true
                });

                if (results.data.length < 5) {
                    return;
                }

                // extract data and headers from results
                const headers = results.meta.fields;
                const data = this.removeRows(
                    results.data as Dictionary[],
                    results.errors.map((e) => e.row)
                );
                const dataset_preview: Dictionary[] = data.slice(0, 3);
                const dataset_headers: Header[] = [];
                const highlyUniqHeaders = this.getHighlyUniqHeaders(
                    data,
                    headers
                );

                if (headers.length < 2) {
                    return;
                }

                // add s/n and key fields to preview rows
                for (let i = 0; i < dataset_preview.length; i++) {
                    dataset_preview[i]['s/n'] = (i + 1).toString();
                    dataset_preview[i]['key'] = (i + 1).toString();
                }

                // add checkboxes row
                const checkboxes_obj: Dictionary = {};
                checkboxes_obj['s/n'] = '0';
                checkboxes_obj['key'] = '0';

                // add ellipsis row
                const ellipsis_obj: Dictionary = {};
                ellipsis_obj['s/n'] = '...';
                ellipsis_obj['key'] = (dataset_preview.length + 1).toString();
                for (let i = 0; i < headers.length; i++) {
                    checkboxes_obj[headers[i]] = '-1';
                    ellipsis_obj[headers[i]] = '...';
                }
                dataset_preview.unshift(checkboxes_obj);
                dataset_preview.push(ellipsis_obj);

                // add s/n field to set of dataset headers
                dataset_headers.push({
                    title: 's/n',
                    dataIndex: 's/n',
                    render: (text: string) => (
                        <span>{text == '0' ? '' : text}</span>
                    ),
                });

                let numHeadersSelected = 0;
                const selectedHeaders = new Set<string>();

                // convert headers from list format to JSON format
                for (let i = 0; i < headers.length; i++) {
                    let title = headers[i];
                    const isHighlyUniq = highlyUniqHeaders.has(headers[i]);

                    if (
                        selectedHeaders.size < this.maxAttributes &&
                        !isHighlyUniq
                    ) {
                        selectedHeaders.add(headers[i]);
                        numHeadersSelected += 1;
                    }

                    if (isHighlyUniq) {
                        title += '**';
                    }

                    dataset_headers.push({
                        title: title,
                        dataIndex: headers[i],
                        render: (text: string) => {
                            if (text == '-1') {
                                return (
                                    <Checkbox
                                        type="checkbox"
                                        defaultChecked={this.state.selectedHeaders.has(
                                            headers[i]
                                        )}
                                        disabled={
                                            (!this.state.selectedHeaders.has(
                                                headers[i]
                                            ) &&
                                                this.state.selectedHeaders
                                                    .size >=
                                                    this.maxAttributes) ||
                                            (this.state.selectedHeaders.has(
                                                headers[i]
                                            ) &&
                                                this.state.selectedHeaders
                                                    .size <= 2)
                                        }
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                this.state.selectedHeaders.add(
                                                    headers[i]
                                                );
                                            } else {
                                                this.state.selectedHeaders.delete(
                                                    headers[i]
                                                );
                                            }

                                            this.setState({
                                                selectedHeaders: this.state
                                                    .selectedHeaders,
                                            });
                                        }}
                                    />
                                );
                            } else {
                                return <span>{text}</span>;
                            }
                        },
                    });
                }

                this.setState({
                    dataset: data,
                    numHeadersSelected: numHeadersSelected,
                    selectedHeaders: selectedHeaders,
                    dataset_headers: dataset_headers,
                    dataset_preview: dataset_preview,
                    selectedFileName: file.name,
                    fileUploadError: false,
                });
            }
        };

        reader.readAsText(file);
    };

    // any attribute with more than 1000 possible/unique values is flagged
    // as "Highly Unique"/Possibly ID
    getHighlyUniqHeaders(
        data: Record<string, string>[],
        headers: string[]
    ): Set<string> {
        const M = data.length;
        const countUniq: Record<string, Set<string>> = {};

        headers.forEach((header) => {
            countUniq[header] = new Set<string>();
        });

        for (let i = 0; i < M; i++) {
            headers.forEach((header) => {
                if (countUniq[header].size < 1000) {
                    countUniq[header].add(data[i][header]);
                }
            });
        }

        const highlyUniqHeaders = new Set<string>();
        headers.forEach((header) => {
            if (countUniq[header].size >= 1000) {
                highlyUniqHeaders.add(header);
            }
        });

        return highlyUniqHeaders;
    }

    // pre-process dataset and start worker to train model
    process_data(): void {
        const M = this.state.dataset.length;
        const N = this.state.selectedHeaders.size;
        const arrHeaders = Array.from(this.state.selectedHeaders);

        // convert data from JSON to array
        const data = new Array<Array<string>>(M);
        for (let i = 0; i < M; i++) {
            data[i] = new Array<string>(N);
            arrHeaders.forEach((header, j, _) => {
                // set iteration in JS is always in insertion order
                data[i][j] = this.state.dataset[i][header];
            });
        }

        // extract possible values for each category
        const dataT = new Array<Array<string>>(N);
        for (let i = 0; i < N; i++) {
            dataT[i] = new Array<string>(M);
            for (let j = 0; j < M; j++) {
                dataT[i][j] = data[j][i];
            }
        }

        const valsToIndex: Record<string, number>[] = [];
        const attrUniqVals: string[][] = [];
        for (let i = 0; i < N; i++) {
            const uniqVals = Array.from(new Set(dataT[i]));
            attrUniqVals.push(uniqVals);

            valsToIndex.push({});
            uniqVals.forEach((val, index, _) => {
                valsToIndex[i][val] = index;
            });
        }

        // convert data to numbers
        const numData = Array<Array<number>>(M);
        for (let i = 0; i < M; i++) {
            numData[i] = new Array<number>(N);
            for (let j = 0; j < N; j++) {
                numData[i][j] = valsToIndex[j][data[i][j]];
            }
        }

        // process data
        this.worker.postMessage(numData);
        this.setState({
            attrUniqVals: attrUniqVals,
        });
    }

    render(): React.ReactNode {
        const state = this.state;
        const buttonNames = [
            'Next',
            'Train',
            'Training',
            'Import another dataset',
        ];

        const analyzeDataSteps = (
            <Steps items={[
                {
                    status: state.currentPage == 0 ? 'process' : 'wait',
                    title: "Import",
                    icon: <UploadOutlined />
                },
                {
                    status: state.currentPage == 1 ? 'process' : 'wait',
                    title: "Edit",
                    icon: <DatabaseOutlined />
                },
                {
                    status: state.currentPage == 2 ? 'process' : 'wait',
                    title: "Train",
                    icon: <SyncOutlined spin={state.currentPage == 2} />
                },
                {
                    status: state.currentPage == 3 ? 'process' : 'wait',
                    title: "Explore",
                    icon: <LineChartOutlined />
                }
            ]} />
        );

        const ProgressFitMle = (
            <Progress
                style={{ margin: '-90px -50px 0px -50px' }}
                type="circle"
                width={100}
                percent={this.state.percentProgress}
                status="active"
            />
        );

        return (
            <Row className="row-full-h-bleed row-100vh">
                <Col
                    className="left-half contrast-half"
                    xs={24}
                    sm={24}
                    md={8}
                    lg={8}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}>
                    <Title>Analyze your own data</Title>
                    <Paragraph>
                        Did you find a dataset online with a record that matches
                        someone you know? Use this tool to find out if the record you found
                        belongs or not to the correct person.
                        <br />
                        <br />
                        <i>
                            This app is running entirely in your browser, and we
                            don't collect your data. :)
                        </i>
                        <br />
                        <br />
                        <i>
                            Due to Javascript's limitations when running in the browser,
                            very large datasets may slow down or crash your browser.
                            If you would like to run a more advanced version of this tool 
                            head on over to <a href="https://github.com/computationalprivacy/CorrectMatch.jl">
                            our Github page</a>.
                        </i>
                    </Paragraph>
                </Col>
                <Col className="right-half" xs={24} sm={24} md={16} lg={16}>
                    <Card
                        className="tools-card"
                        title={analyzeDataSteps}
                        actions={[
                            <Button
                                key="btn-analyze-data-steps"
                                onClick={this.nextPageClicked}
                                disabled={state.currentPage == 2}
                                type="primary"
                                style={{
                                    width: 'calc(100% - 40px)',
                                    marginLeft: '20px',
                                    marginRight: '20px',
                                }}>
                                {buttonNames[state.currentPage]}
                            </Button>,
                        ]}
                        bodyStyle={{ height: 'calc(100% - 124px)' }}>
                        <div
                            style={{
                                height: '100%',
                                position: 'relative',
                                overflowY: 'auto',
                            }}>
                            {state.currentPage == 0 ? (
                                <ChooseDataset
                                    samplingPercentages={
                                        this.samplingPercentages
                                    }
                                    selectedFileName={state.selectedFileName}
                                    fileSelectedHandler={
                                        this.fileSelectedHandler
                                    }
                                    fileUploadError={state.fileUploadError}
                                    samplingPercentageChangeHandler={(val) =>
                                        this.setState({
                                            selectedSamplingPercentage: Math.floor(
                                                100 / val
                                            ),
                                        })
                                    }
                                />
                            ) : null}
                            {state.currentPage == 1 ||
                            state.currentPage == 2 ? (
                                <Spin
                                    indicator={ProgressFitMle}
                                    tip={
                                        this.state.eta >= 0
                                            ? `Training model... ETA: ${this.state.eta}s`
                                            : 'Training model...'
                                    }
                                    size="large"
                                    spinning={state.currentPage == 2}>
                                    <ChooseHeaders
                                        maxAttributes={this.maxAttributes}
                                        dataset_headers={state.dataset_headers}
                                        dataset_preview={state.dataset_preview}
                                        selectedHeaders={state.selectedHeaders}
                                    />
                                </Spin>
                            ) : null}
                            {state.currentPage == 3 ? (
                                <UniquenessData
                                    attrs={state.attrs}
                                    attrMeans={state.attrMeans}
                                    attrUniqVals={state.attrUniqVals}
                                    selectedHeaders={Array.from(
                                        state.selectedHeaders
                                    )}
                                    randRecord={this.randRecord}
									hasAge={false}
                                    N={state.popNum}
                                    G={state.G}
									birthdate={null}
                                />
                            ) : null}
                        </div>
                    </Card>
                </Col>
            </Row>
        );
    }
}

interface IState {
    selectedFileName: string;
    fileUploadError: boolean;
    selectedSamplingPercentage: number;
    numHeadersSelected: number;
    selectedHeaders: Set<string>;
    dataset: Dictionary[];
    dataset_headers: Header[];
    dataset_preview: Dictionary[];
    currentPage: number;
    G: GaussianCopula;
    popNum: number;
    attrs: number[];
    attrMeans: number[];
    attrUniqVals: string[][];
    percentProgress: number;
    eta: number;
}

export type Header = {
    title: string;
    dataIndex: string;
    render: (text: string) => JSX.Element;
};
export type Dictionary = Record<string, string>;
