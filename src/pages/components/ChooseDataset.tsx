import React from 'react';
import { createRef } from 'react';

import { Alert, Button, Form, Select, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
const { Text } = Typography;

export default class ChooseDataset extends React.Component<IProps, unknown> {
    private file_input = createRef<HTMLInputElement>();
    private file_text = createRef<HTMLSpanElement>();

    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
            <div
                style={{ width: '100%' }}>
                <Button onClick={() => this.file_input.current.click()}>
                    <UploadOutlined /> Select Dataset
                </Button>
                <span ref={this.file_text} style={{ marginLeft: 10 }}>
                    {this.props.selectedFileName}
                </span>
                <br />
                <input
                    ref={this.file_input}
                    type="file"
                    accept="text/csv"
                    onClick={(e) =>
                        ((e.target as HTMLInputElement).value = null)
                    }
                    onChange={this.props.fileSelectedHandler}
                    style={{ display: 'none' }}
                />
                <br />
                <Form.Item
                    label="What is the sample size?"
                    style={{ width: '100%' }}>
                    <Select
                        defaultValue={this.props.samplingPercentages[0]}
                        onChange={this.props.samplingPercentageChangeHandler}>
                        {this.props.samplingPercentages.map((percentage) => (
                            <Select.Option key={percentage} value={percentage}>
                                {percentage}%
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                {this.props.fileUploadError ? (
                    <Alert
                        message="Please upload a valid csv file"
                        type="error"
                    />
                ) : null}
                <br />
                <Alert
                    message="How do I use this?"
                    description={
                        <Text>
                            <Text keyboard>Datasets</Text> are expected to follow
                            the CSV protocol with the first row being the header. To simply try this tool with a sample toy dataset, we provide a copy of the ADULT dataset {' '}
                            <a href="/adult.csv">here</a>. Click on <Text keyboard>Select Dataset</Text> and upload the downloaded dataset to get started!
                            <br />
                            <br />
                            The <Text keyboard>sample size</Text> represents the
                            fraction of the overall population used to build your dataset.
                            A ‘1%’ sample size means the total population is 100x larger than your dataset.
                        </Text>
                    }
                    type="info"
                    showIcon
                />
            </div>
        );
    }
}

interface IProps {
    samplingPercentages: number[];
    selectedFileName: string;
    fileSelectedHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileUploadError: boolean;
    samplingPercentageChangeHandler: (value: number) => void;
}
