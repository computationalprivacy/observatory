import React, { createRef } from 'react';

import { Card, Col, Collapse, Row, Typography } from 'antd';
import { RouteComponentProps } from 'react-router-dom';
const { Paragraph, Title } = Typography;
const { Panel } = Collapse;

export default class AboutPage extends React.Component<RouteComponentProps, any> {
    private about_us = createRef<HTMLDivElement>();

    componentDidMount(): void {
        if (this.props.location.hash == "#about-us") {
            this.about_us.current.scrollIntoView();
        }
    }

    componentDidUpdate(): void {
        if (this.props.location.hash == "#about-us") {
            this.about_us.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    render(): React.ReactNode {
        return (
            <>
                <Row className="row-v-spacing" justify="center">
                    <Col xs={24} sm={24} md={16} lg={12}>
                        <Title level={3}>
                            De-identification & Re-identification
                        </Title>
                        <Paragraph>
                            Three months ago, you noticed that <i>XYZ Health</i>{' '}
                            was cheaper than other health insurances and you
                            signed up with them. Reading their privacy policy,
                            you find out that{' '}
                            <a href="https://www.theguardian.com/technology/2017/jan/10/medical-data-multibillion-dollar-business-report-warns">
                                they collect and sell your data to third
                                parties.
                            </a>{' '}
                            The policy states that this data “might include”
                            demographic data along with financial and health
                            information. You feel weird but Jack from customer
                            service reassures you: you should not worry. The
                            data being shared is “<i>anonymous</i>” (also called{' '}
                            <a href="https://en.wikipedia.org/wiki/De-identification">
                                <i>de-identified</i>
                            </a>{' '}
                            or{' '}
                            <a href="https://www.wsj.com/articles/you-give-apps-sensitive-personal-information-then-they-tell-facebook-11550851636">
                                <i>depersonalized</i>
                            </a>
                            ) and third parties only have access to at most 1%
                            of the database.
                            <br />
                            <br />
                            Is the data truly anonymous and is your information
                            safe? Or could a few pieces of information be used
                            to re-identify you?
                        </Paragraph>
                    </Col>
                </Row>
                <Row className="row-v-spacing row-light-contrast" justify="center">
                    <Col xs={24} sm={24} md={16} lg={12}>
                        <Title level={3} style={{ textAlign: 'center' }}>
                            Is XYZ's Health Anonymous?
                        </Title>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            <img
                                className="dynamicScaleImg"
                                src="/observatory/assets/fig_anon_record.png"
                                width="10%"
                                style={{ objectFit: 'contain' }}
                            />
                            <Paragraph
                                className="dynamicScaleText"
                                style={{
                                    display: 'grid',
                                    placeItems: 'center',
                                    margin: 0,
                                    width: '50%',
                                }}>
                                This is what the anonymized data from a
                                fictional “XYZ Health” could look like. This
                                record, n°1343, contains demographics and
                                medical information about a male individual born
                                in 1955 and living in Cambridge, MA (USA). The
                                medical information could contain visits to
                                specialists (here no visit to a pediatric
                                specialist in the last 12 months), as well as
                                other information such as the individual's
                                current deductible and demographic attributes.
                            </Paragraph>
                        </div>
                        <br />
                        <br />
                        <Paragraph>
                            Researchers have long shown that, even when it does
                            not contain direct identifiers (e.g. name, email
                            address or social security number), anonymous data
                            can be re-identified. In the mid-1990s, Latanya
                            Sweeney was for instance able to{' '}
                            <a href="https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/">
                                re-identify the medical records of William Weld
                            </a>{' '}
                            (the then Governor of Massachusetts), by knowing his
                            ZIP code, date of birth, and gender. Similarly,
                            German journalists recently{' '}
                            <a href="https://www.theguardian.com/technology/2017/aug/01/data-browsing-habits-brokers">
                                re-identified the browsing history
                            </a>{' '}
                            of a judge and a German MP from an anonymized
                            dataset they gained access to by pretending to be
                            potential buyers.
                            <br />
                            <br />
                            Pressed by NGOs and policy makers to truly anonymize
                            the data before sharing it, companies wanting to
                            share data started to sample datasets before
                            releasing them (only releasing data about a few
                            thousand people instead of the entire dataset). The
                            idea is to lower the risk and provide individuals
                            with plausible deniability if re-identified. If your
                            employer, Linda, finds a record that matches your
                            demographics in XYZ Health's 1% sampled anonymized
                            dataset, this record could very well belong to
                            someone else. Indeed, if a UK dataset contains data
                            about 10,000 individuals or 0.003% of the whole
                            population, the record that was found could always
                            belong to one of the 99.997% of other Brits.
                        </Paragraph>
                    </Col>
                </Row>
                <Row className="row-v-spacing" justify="center">
                    <Col xs={24} sm={24} md={16} lg={12}>
                        <Title level={3} style={{ textAlign: 'center' }}>
                            Does sampling actually help?
                        </Title>
                        <img src="/observatory/assets/fig_sampling.png" width="100%" />
                        <Paragraph>
                            <b>Sampling in theory</b>: Every dot is one
                            individual. Some share your basic demographics (in
                            red), many do not. If someone accesses a small
                            sample of records from all XYZ Health's customers,
                            and find a record that matches your demographics,
                            how can they know that this record is yours? Maybe
                            this is actually someone else's data, sharing the
                            same postcode district, date of birth, and gender,
                            and you are one of the other red dots.
                        </Paragraph>
                        <br />
                        <Paragraph>
                            Sampling is widely used to anonymize and then
                            release data. For instance, in their recent{' '}
                            <a href="https://www.oaic.gov.au/agencies-and-organisations/guides/de-identification-and-the-privacy-act">
                                De-identification guide
                            </a>
                            , the Office of the Australian Information
                            Commissioner states that sampling “
                            <i>
                                [creates] uncertainty that any particular person
                                is even included in the dataset.
                            </i>
                            ” The issue? It does not work.
                            <br />
                            <br />
                            The intuition is the following: there might be a lot
                            of people in their thirties, male, and living in New
                            York City. So the record found using this
                            information might belong to someone else. However,
                            as the record starts to match on more and more of
                            the characteristics of the person you are searching for,
                            it becomes increasingly likely that you found the
                            right person. There is probably one and only one
                            male, living in NYC, born on Jan 5 1987, driving a
                            red Mazda, living with two kids (both girls) and one
                            dog.
                            <br />
                            <br />
                            In{' '}
                            <a href="https://nature.com/articles/s41467-019-10933-3">
                                our article
                            </a>{' '}
                            published in Nature Communications, we developed a
                            statistical model to evaluate the likelihood of a
                            match to be so good that it's extremely unlikely to
                            be incorrect. The characteristics are so precise
                            they probably only match one and only one person in
                            the entire UK population. We validated our approach
                            on 210 datasets from demographic and survey data and
                            showed that even extremely small sampling fractions
                            are not sufficient to prevent re-identification and
                            protect your data. Our method obtains AUC accuracy
                            scores ranging from 0.84 to 0.97 for predicting
                            individual uniqueness with a low false-discovery
                            rate. We showed that 99.98% of Americans were
                            correctly re-identified in any available
                            ‘anonymised’ dataset by using just 15
                            characteristics, including age, gender, and marital
                            status.
                        </Paragraph>
                    </Col>
                </Row>
                <Row className="row-v-spacing row-light-contrast" justify="center">
                    <Col xs={24} sm={24} md={16} lg={12}>
                        <Title level={3} style={{ textAlign: 'center' }}>
                            What does this mean?
                        </Title>
                        <Paragraph>
                            Our model computes the probability that a match is
                            correct, meaning that this record is yours, based on
                            the predicted number of people that share your
                            attributes in the UK population. If you are unique,
                            the match will always be correct. If two other
                            people share this combination, you have 1 chance of
                            3 to be correctly re-identified, etc. Contrary to
                            popular belief, sampling a dataset does not provide
                            plausible deniability and does not effectively
                            protect people's privacy.
                            <br />
                            <br />
                            We believe that, in general, it is time to move away
                            from de-identification and tighten the rules for
                            considering datasets as truly anonymized. Making
                            sure data can be used statistically, e.g. for
                            medical research, is extremely important but cannot
                            happen at the expense of people's privacy. Datasets
                            such as the{' '}
                            <a href="https://science.sciencemag.org/content/339/6117/321">
                                NIGMS and NIH genetic data
                            </a>
                            , the{' '}
                            <a href="https://arxiv.org/abs/1307.1370">
                                Washington State Health Data
                            </a>
                            , the{' '}
                            <a href="http://gawker.com/the-public-nyc-taxicab-database-that-accidentally-track-1646724546">
                                NYC Taxicab
                            </a>{' '}
                            dataset, the{' '}
                            <a href="https://vartree.blogspot.com/2014/04/i-know-where-you-were-last-summer.html">
                                Transport For London bike sharing
                            </a>{' '}
                            dataset, and the Australian de-identified{' '}
                            <a href="https://arxiv.org/abs/1712.05627">
                                Medicare Benefits Schedule (MBS) and
                                Pharmaceutical Benefits Schedule (PBS)
                            </a>{' '}
                            datasets have been shown to be easily
                            re-identifiable. To quote the U.S. President's
                            Council of Advisors on Science and Technology
                            (PCAST): “
                            <i>
                                Anonymization remains somewhat useful as an
                                added safeguard, but it is not robust against
                                near-term future re-identification methods.
                                PCAST does not see it as being a useful basis
                                for policy
                            </i>
                            ”.
                        </Paragraph>
                    </Col>
                </Row>
                <Row className="row-v-spacing" justify="center" id="about-us" ref={this.about_us}>
                    <Col xs={24} sm={24} md={16} lg={12}>
                        <Title level={3} style={{ textAlign: 'center' }}>
                            Who are we?
                        </Title>
                        <Paragraph>
                            The research and the development of the Observatory was carried at the Université
                            catholique de Louvain (Belgium) and at Imperial
                            College London (UK).
                        </Paragraph>
                        <Row gutter={16} style={{ textAlign: 'center' }}>
                            <Col xs={24} sm={24} md={12} lg={6}>
                                <Card
                                    hoverable
                                    onClick={() =>
                                        window.open(
                                            'https://rocher.lc/',
                                            '_blank'
                                        )
                                    }
                                    bordered={false}
                                    cover={
                                        <img src="/observatory/assets/luc-rocher.png" />
                                    }>
                                    <Title level={4}>Luc Rocher</Title>
                                    Research Associate,
                                    <br />
                                    Imperial College London
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={6}>
                                <Card
                                    hoverable
                                    onClick={() =>
                                        window.open(
                                            'https://perso.uclouvain.be/julien.hendrickx/',
                                            '_blank'
                                        )
                                    }
                                    bordered={false}
                                    cover={
                                        <img src="/observatory/assets/julien-hendrickx.jpg" />
                                    }>
                                    <Title level={4}>Julien Hendrickx</Title>
                                    Professor,
                                    <br />
                                    UCLouvain
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={6}>
                                <Card
                                    hoverable
                                    onClick={() =>
                                        window.open(
                                            'https://demontjoye.com/',
                                            '_blank'
                                        )
                                    }
                                    bordered={false}
                                    cover={
                                        <img src="/observatory/assets/y-a-demontjoye.png" />
                                    }>
                                    <Title level={4}>
                                        Yves-Alexandre de Montjoye
                                    </Title>
                                    Associate Professor,
                                    <br />
                                    Imperial College London
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={6}>
                                <Card
                                    hoverable
                                    onClick={() =>
                                        window.open(
                                            'mailto:mrmmsmsa.2k12@gmail.com',
                                            '_blank'
                                        )
                                    }
                                    bordered={false}
                                    cover={
                                        <img src="/observatory/assets/meenatchi-sundaram-msa.jpg" />
                                    }>
                                    <Title level={4}>
                                        Meenatchi Sundaram MSA
                                    </Title>
                                    Undergrad,
                                    <br />
                                    Imperial College London
                                </Card>
                            </Col>
                        </Row>
                        <br />
                        <Paragraph>
                            This work was made possible thanks to the Belgian
                            Fund for Scientific Research (F.R.S.-FNRS), Imperial
                            College's European Partners Fund and a WBI World
                            Excellence Grant. We received support from the
                            Information Commissioner Office under the Harpo
                            project to develop this tool.
                            <br />
                            <br />
                            The website uses public-use data from IPUMS-International to train our statistical models in 89 countries. The data was originally collected by the statistical agencies available at:
                            <a href="https://international.ipums.org/international/citation_stats_offices.shtml">
                            IPUMS | Citation of National Statistical Offices
                            </a>.
                        </Paragraph>
                        <Title level={4}>How to cite this work</Title>
                        <Paragraph>
                            Luc Rocher, Julien Hendrickx, and Yves-Alexandre de
                            Montjoye.{' '}
                            <a href="https://nature.com/articles/s41467-019-10933-3">
                                “Estimating the success of re-identifications in
                                incomplete datasets using generative models.”
                            </a>{' '}
                            Nature Communications 10 (2019) 3069.
                        </Paragraph>
                        <Title level={4}>How to access the source code</Title>
                        <Paragraph>
                            Free and open source codes of the underlying model in <a href="https://github.com/computationalprivacy/CorrectMatch.jl">Julia</a> and <a href="https://github.com/computationalprivacy/pycorrectmatch">Python</a> are available on <a href="https://github.com/computationalprivacy/">Github</a>.
                        </Paragraph>
                    </Col>
                </Row>
            </>
        );
    }
}
