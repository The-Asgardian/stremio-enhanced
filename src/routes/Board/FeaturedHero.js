const React = require('react');
const PropTypes = require('prop-types');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Button, Image } = require('stremio/components');
const styles = require('./styles');

const FeaturedHero = ({ item }) => {
    const { t } = useTranslation();
    if (!item) return null;

    const detailsHref = item.deepLinks?.metaDetailsStreams || item.deepLinks?.metaDetailsVideos;
    const hasDirectPlay = typeof item.deepLinks?.player === 'string';
    const primaryHref = hasDirectPlay ? item.deepLinks.player : detailsHref;
    const primaryLabel = hasDirectPlay ? t('WATCH_NOW') : t('SHOW');

    return (
        <section className={styles['featured-hero']} aria-labelledby="featured-title">
            <Image className={styles['featured-image']} src={item.background || item.poster} alt={' '} />
            <div className={styles['featured-scrim']} />
            <div className={styles['featured-content']}>
                <div className={styles['featured-meta']}>
                    {item.releaseInfo || item.released?.getFullYear?.() || null}
                    {item.runtime ? <span>{item.runtime}</span> : null}
                </div>
                <h1 id="featured-title" className={styles['featured-title']}>{item.name}</h1>
                {item.description ? <p className={styles['featured-description']}>{item.description}</p> : null}
                <div className={styles['featured-actions']}>
                    {primaryHref ? (
                        <Button className={styles['featured-primary']} href={primaryHref}>
                            <Icon name={hasDirectPlay ? 'play' : 'details'} />
                            <span>{primaryLabel}</span>
                        </Button>
                    ) : null}
                    {hasDirectPlay && detailsHref ? (
                        <Button className={styles['featured-secondary']} href={detailsHref}>
                            <Icon name={'details'} />
                            <span>{t('SHOW')}</span>
                        </Button>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

FeaturedHero.propTypes = {
    item: PropTypes.object,
};

module.exports = FeaturedHero;
