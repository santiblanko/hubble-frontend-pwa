<template>
    <div class="view-category">
        <g-t-m-data-layer
            v-if="loaded"
            :event="'categoryLoaded'"
            :page-type="'category'"
            :page-title="categoryItem.name"
            :breadcrumbs="breadcrumbs"
        />

        <div v-if="!onIndexPage" class="container breadcrumbs-wrp">
            <breadcrumbs :path="breadcrumbs" />
        </div>

        <template v-if="isShopware">
            <div class="container">
                <sw-section v-for="cmsSection in cmsSections" :key="cmsSection.id" :content="cmsSection" />
            </div>
        </template>

        <template v-else>
            <div class="container category-header">
                <h1 class="title headline-1" v-text="categoryItem.name" />
                <div :style="categoryText !== '' ? 'min-height: 95px;' : ''">
                    <client-only>
                        <text-excerpt v-if="categoryText" :text="categoryText" :limit="$mq === 'md' || $mq === 'sm' ? 300 : 900" />
                    </client-only>
                </div>
            </div>

            <template v-if="!errorNoProducts">
                <div class="container category-content-wrp">
                    <div class="category-products-wrp">
                        <product-listing-toolbar :extra-class="{ 'fixed container': isSticky }" />
                        <product-listing
                            :data-items="categoryProductItems"
                            list="Category"
                            :extra-class="{ 'offset-top': isSticky }"
                            :category="categoryItem.name"
                        />
                        <div class="pagination-bottom">
                            <pagination />
                        </div>
                        <div v-if="categoryTextLong" class="category-description">
                            <div v-if="$mq === 'sm' || $mq === 'md'" v-html="categoryTextLong" />
                            <div v-if="$mq === 'lg'" v-html="categoryTextLong" />
                        </div>
                    </div>
                </div>
            </template>

            <template v-else>
                <div class="error-listing container flex-center flex-column">
                    <error-no-items :error="error" />
                    <button class="button-primary" @click="routeHistoryBack()">
                        {{ $t('Back') }}
                        <material-ripple />
                    </button>
                </div>
            </template>
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Breadcrumbs from '../utils/Breadcrumbs';
import TextExcerpt from '../utils/TextExcerpt';
import ProductListingToolbar from './ProductListingToolbar';
import _ from 'lodash';

export default {
    name: 'CategoryListing',

    components: {
        Breadcrumbs,
        ProductListingToolbar,
        TextExcerpt,
        ProductListing: () => import('./ProductListing'),
        Pagination: () => import('./toolbar/Pagination'),
        GTMDataLayer: () => import('../utils/GTMDataLayer'),
        swSection: () => import('~/components/swComponents/section.vue'),
        errorNoItems: () => import('~/components/error/noItems.vue'),
    },

    data() {
        return {
            parentCategory: {},
            error: {
                statusCode: 400,
                message: 'There are no products available in this category or for this filter.',
            },
            categoryItem: {},
            categoryData: {},

            isSticky: false,
            position: 0,
            isScrolling: false,

            loaded: false,

            isShopware: process.env.API_TYPE === 'sw',
            cmsSections: {},
        };
    },

    computed: {
        ...mapState({
            dataCategory: state => state.modApiCategory.dataCategory,
            dataCategoryProducts: state => state.modApiCategory.dataCategoryProducts,
            dataMenu: state => state.modApiMenu.dataMenu,
            cmsObject: state => state.modApiResources.cmsObject,
        }),
        ...mapGetters({
            requestCategoryFacets: 'modApiRequests/getRequestCategoryFacets',
        }),
        categoryProductItems() {
            if (_.isEmpty(this.dataCategoryProducts)) {
                return this.dataCategoryProducts;
            }

            return this.dataCategoryProducts.result.items;
        },
        errorNoProducts() {
            return _.isEmpty(this.categoryProductItems);
        },
        breadcrumbs() {
            let array = [];

            if (!_.isEmpty(this.categoryItem)) {
                let ids = this.categoryItem.path_ids;
                let names = this.categoryItem.path_names;
                let urls = this.categoryItem.path_urls;

                ids.forEach(function (element, index) {
                    array[index] = {
                        name: names[index],
                        url: urls[index],
                    };
                });
            }
            return array;
        },
        onIndexPage() {
            return this.$route.path === '/';
        },
        categoryText() {
            if (!_.isEmpty(this.categoryItem)) {
                return this.categoryItem.teaser;
            }

            return '';
        },
        categoryTextLong() {
            if (!_.isEmpty(this.categoryItem)) {
                return this.categoryItem.description;
            }

            return '';
        },
        pathIds() {
            if (!_.isEmpty(this.categoryItem)) {
                return this.categoryItem.path_ids;
            }

            return [];
        },
        categoryId() {
            if (!_.isEmpty(this.categoryItem)) {
                return this.categoryItem.id;
            }

            return 0;
        },
        categoryProductStats() {
            return this.dataCategoryProducts.result.stats;
        },
        currentCategoryPath() {
            return this.categoryItem.path_urls.slice(-1)[0];
        },
    },

    created() {
        this.setCategoryItem();
        this.setCategoryData();
        this.setParentCategory();
        this.setCmsSections();
    },

    mounted() {
        if (this.$mq === 'lg') {
            window.addEventListener(
                'scroll',
                event => {
                    // Clear our timeout throughout the scroll
                    window.clearTimeout(this.isScrolling);
                    // Set a timeout to run after scrolling ends
                    this.isScrolling = setTimeout(() => {
                        // Run the callback
                        this.handleScroll();
                    }, 66);
                },
                false
            );
        }

        this.loaded = true;

        this.$nextTick(() => {
            // Set position data for sticky elements
            if (document.getElementsByClassName('listing-wrp')) {
                if (this.$mq === 'lg') {
                    if (document.getElementsByClassName('listing-wrp')[0]) {
                        let bodyRect = document.body.getBoundingClientRect(),
                            elemRect = document.getElementsByClassName('listing-wrp')[0].getBoundingClientRect();
                        this.position = elemRect.top - bodyRect.top;
                    }
                }
            }
        });
    },

    methods: {
        setCategoryItem: function () {
            // Set data from store on create instead of use vuex store directly
            // This prevents showing data of next category if user switches between categories
            if (!_.isEmpty(this.dataCategory.result)) {
                this.categoryItem = this.dataCategory.result.item;
            }
        },
        setCategoryData: function () {
            if (!_.isEmpty(this.dataMenu.result)) {
                this.categoryData = this.dataMenu.result.items;
            }
        },
        setParentCategory: function () {
            if (!_.isEmpty(this.categoryData)) {
                this.categoryData.forEach(item => {
                    if (!_.isEmpty(this.categoryItem['path_ids'])) {
                        if (item.id === this.categoryItem['path_ids'][0]) {
                            this.parentCategory = item;
                        }
                    }
                });
            }
        },
        setCmsSections: function () {
            if (this.isShopware && !_.isEmpty(this.cmsObject)) {
                this.cmsSections = this.cmsObject.sections;
            }
            return [];
        },
        handleScroll: function (event) {
            this.setStickyFlag();
        },
        setStickyFlag() {
            if (this.$mq === 'lg' && window.pageYOffset > this.position) {
                this.isSticky = true;
            } else {
                this.isSticky = false;
            }
        },
        routeHistoryBack() {
            this.$router.go(-1);
        },
    },

    head() {
        let metaDescription = {},
            metaKeywords = {},
            metaTitle = '';

        if (!_.isEmpty(this.categoryItem.meta_description)) {
            metaDescription = this.categoryItem.meta_description;
        } else {
            metaDescription = process.env.meta.category.metaDescription;
        }

        if (!_.isEmpty(this.categoryItem.meta_keywords)) {
            metaKeywords = this.categoryItem.meta_keywords;
        } else {
            metaKeywords = process.env.meta.category.metaKeywords;
        }

        if (!_.isEmpty(this.categoryItem.meta_title)) {
            metaTitle = this.categoryItem.meta_title;
        } else if (!_.isEmpty(this.categoryItem.name)) {
            metaTitle = this.categoryItem.name + process.env.meta.category.titleAdd;
        } else {
            metaTitle = process.env.meta.category.title;
        }

        return {
            title: metaTitle,
            meta: [
                // hid is used as unique identifier. Do not use `vmid` for it as it will not work
                { hid: 'description', name: 'description', content: metaDescription },
                { hid: 'keywords', name: 'keywords', content: metaKeywords },
                { hid: 'robots', name: 'robots', content: 'INDEX, FOLLOW' },
            ],
        };
    },
};
</script>
