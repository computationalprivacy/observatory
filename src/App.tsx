import React, { lazy, Suspense } from 'react';
import { matchPath, withRouter, Switch, Route, RouteComponentProps, Link } from 'react-router-dom';

import { Button, Drawer, Layout, List, PageHeader, Row, Col, Tag } from 'antd';
const { Content, Footer } = Layout;
const { CheckableTag } = Tag;

import { MenuOutlined } from '@ant-design/icons';

const MainPage = lazy(() => import('./pages/MainPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const IndividualRiskPage = lazy(() => import('./pages/IndividualRiskPage'));
const CountryReportsPage = lazy(() => import('./pages/CountryReportsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

import './App.less';

class App extends React.Component<RouteComponentProps, unknown> {
    pages = [
        {
            title: 'Home',
            url: '/observatory',
            page: MainPage,
            has_pill: true,
        },
        {
            title: 'Try for yourself',
            url: '/observatory/take-the-quiz/:iso3?',
			baseUrl: '/observatory/take-the-quiz',
            page: IndividualRiskPage,
            has_pill: false,
        },
        {
            title: 'Explore anonymity',
            url: '/observatory/explore',
            page: CountryReportsPage,
            has_pill: true,
        },
        {
            title: 'Analyze your data',
            url: '/observatory/analyze-your-data',
            page: ToolsPage,
            has_pill: true,
        },
        {
            title: 'Why it matters',
            url: '/observatory/why-it-matters',
            page: AboutPage,
            has_pill: true,
        },
        {
            title: 'About Us',
            url: '/observatory/why-it-matters#about-us',
            page: AboutPage,
            has_pill: true,
        },
    ];

    state = { visible: false };

    showDrawer = () => {
        this.setState({ visible: true });
    };
    
    onClose = () => { this.setState({ visible: false });
    };

    render(): React.ReactNode {
        return (<>
            <Layout className="layout">
				<PageHeader
                    title="The Observatory of Anonymity"
					extra={<div className="header-extra">
						{this.pages.map((page, index, _) => page.has_pill ? (
                            <Link className="header-nav-tag" key={index} to={page.baseUrl ? page.baseUrl : page.url}>
                                <CheckableTag
                                    key={index}
									checked={matchPath(this.props.location.pathname, { path: page.url, exact: true }) != null}>
                                    {page.title}
                                </CheckableTag>
                            </Link>
                        ) : null )}
                        <Button className="header-nav-btn" type="link" onClick={this.showDrawer} icon={<MenuOutlined />} />
                        <Drawer className="header-nav-drawer"placement='right' closable={false} onClose={this.onClose} visible={this.state.visible}>
                            <List dataSource={this.pages} renderItem={page => (
                                <List.Item
                                    key={page.url}
                                    actions={[
                                        <Link key={page.url} to={page.baseUrl ? page.baseUrl : page.url}>
                                            <CheckableTag key={page.url}
                                            checked={matchPath(this.props.location.pathname, { path: page.url, exact: true }) != null}
                                            onClick={this.onClose}>
                                            {page.title}
                                            </CheckableTag>
                                        </Link>
                                ]}>
                                </List.Item>
                            )} />
                        </Drawer>
					</div>}
                />
                <Content className="site-layout-content">
                    <Suspense fallback={<div></div>}>
                        <Switch>
                            {this.pages.map((page, index, _) => (
                                <Route key={index} exact path={page.url} component={page.page}/>
                            ))}
                            <Route path="/" exact>
                                <MainPage />
                            </Route>
                        </Switch>
                    </Suspense>
                </Content>
            </Layout>
            <Layout className="layout-footer">
                <Footer className="site-layout-footer">
                    <Row className="row-v-spacing" justify="center">
                        <Col xs={24} sm={24} md={16} lg={12}>
                            <h3>The Observatory of Anonymity</h3>
                            <p>The Computational Privacy Group (CPG) is committed to protecting the privacy of visitors to our website. The Observatory of Anonymity does not collect nor share any personal data. All statistical computations run entirely in the browser, and no personal data is transmitted to Imperial College's servers. We only collect anonymous analytics (page URL and user agent).</p>
                            <p>The source code of the Observatory is available at <a href="https://github.com/computationalprivacy/observatory">https://github.com/computationalprivacy/observatory</a> and distributed under a free license.</p>
                            <h3>Contacting us</h3>
                            <p>Have questions, comments, or concerns? Please contact <a href="https://rocher.lc/">Luc Rocher</a> by email at: lrocher (at) imperial (dot) ac (dot) uk.</p>
                            <br />
                            <a href="https://cpg.doc.ic.ac.uk/"><img src="/observatory/assets/logo-cpg-icl.png" style={{ objectFit: 'contain', maxWidth: '50%' }} /></a>
                        </Col>
                    </Row>
                </Footer>
            </Layout>
        </>);
    }
}

export default withRouter(App);
export interface Country {
    iso3: string;
    name: string;
    continent: string;
}
