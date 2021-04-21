import React from 'react';

import { Table, Tag, Tooltip, Typography } from 'antd';
const { Paragraph, Text } = Typography;
import { InfoCircleOutlined } from '@ant-design/icons';

import { Header, Dictionary } from '../ToolsPage';

export default class ChooseHeaders extends React.Component<IProps, unknown> {
    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
            <div>
                <Paragraph>
                    Please select which attributes you want to train the
                    model on. The demo is running in your browser, and we can
                    only train on a maximum of{' '}
                    <Tag color="#f50">{this.props.maxAttributes}</Tag>
                    attributes.
                    <br />
                    The first {this.props.maxAttributes} attributes have been pre-selected for you.
                    Some headers, identified as IDs, may have been deselected for you.
                </Paragraph>
                <Paragraph strong={true}>
                    Selected Attributes:
                    {Array.from(this.props.selectedHeaders).map(
                        (header, index, _) => (
                            <Tag
                                key={index}
                                color="#cc7722"
                                style={{ marginLeft: '10px' }}>
                                {header}
                            </Tag>
                        )
                    )}
                </Paragraph>
                <Table
                    scroll={{ x: '100%' }}
                    columns={this.props.dataset_headers}
                    dataSource={this.props.dataset_preview}
                    pagination={{ hideOnSinglePage: true }}
                />
            </div>
        );
    }
}

interface IProps {
    maxAttributes: number;
    selectedHeaders: Set<string>;
    dataset_headers: Header[];
    dataset_preview: Dictionary[];
}
