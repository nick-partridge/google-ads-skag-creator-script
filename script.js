function main() {

    /************ GENERAL SETTINGS ************/

    //CONVERSION TARGET - THIS IS YOUR MINIMUM TARGET, ANYTHING BELOW THIS WILL NOT BE TARGETED. 0 IS A POSSIBLE OPTION IF YOU WANT TO INCLUDE NON-CONVERTING QUERIES
    var query_conversions = '0';

    //IMPRESSION TARGET - THIS IS YOUR MINIMUM TARGET, ANYTHING BELOW THIS WILL NOT BE TARGETED. RECOMMEND GOING FOR AT LEAST 1+ IMPRESSIONS PER DAY TO AVOID LOW IMPRESSION STATUS
    var query_impressions = '1';

    //COST PER CONVERSION TARGET (OPTIONAL) - THIS IS YOUR MAX TARGET, ANYTHING ABOVE THIS WILL NOT BE TARGETED
    var query_cpa = '';

    //ROAS TARGET (OPTIONAL) - THIS IS YOUR MINIMUM TARGET, ANYTHING BELOW THIS WILL NOT BE TARGETED - 1 IS 100% (WHICH IS BREAK EVEN), 1.5 IS 150%, ETC
    var query_roas = '';

    //DATE RANGE - //TODAY, YESTERDAY, LAST_7_DAYS, THIS_WEEK_SUN_TODAY, THIS_WEEK_MON_TODAY, LAST_WEEK, LAST_14_DAYS, LAST_30_DAYS, LAST_WEEK, LAST_BUSINESS_WEEK, LAST_WEEK_SUN_SAT, THIS_MONTH, LAST_MONTH 
    var date_range = 'LAST_30_DAYS';

    /************ CAMPAIGN/AD GROUP CONFIG SETTINGS ************/

    //PUT EXACT MATCH SKAGS INTO A SEPARATE, EXACT MATCH ONLY CAMPAIGN - 'true' or 'false' (WITHOUT QUOTES) ARE THE OPTIONS.
    var em_only_campaign = false;

    //NOTE - YOU HAVE TO HAVE ALREADY CREATED A SEPARATE CAMPAIGN(S) FOR em_only_campaign TO WORK
    //NOTE 2 - WHEN SETTING em_only_campaign TO TRUE, IN PREVIEW MODE IT WILL APPEAR THAT THE NEGATIVE KEYWORD BEING CREATED IN THE ORIGINAL CAMPAIGN IS BROAD MATCH, WHEN IN FACT IT'S EXACT MATCH

    //SUFFIX FOR THE EXACT MATCH ONLY CAMPAIGN NAME THAT THE SCRIPT WILL PUT YOUR NEWLY CREATED AD GROUPS INTO, IF em_only_campaign IS SET TO TRUE
    //FOR EXAMPLE, IF YOUR CAMPAIGN NAME IS 'CAMPAIGN 1' AND YOU'VE NAMED THE 'em_only_campaign_suffix' SUFFIX ' - [E] SKAG', THEN THE SCRIPT WILL TRY TO FIND A CAMPAIGN NAMED 'CAMPAIGN 1 - [E] SKAG' TO PUT YOUR EXACT MATCH SKAG INTO
    var em_only_campaign_suffix = ' - [E] SKAG';

    //CREATE AD GROUPS THAT CONTAIN BOTH PHRASE AND EXACT MATCH TYPES WITHIN IT - 'true' or 'false' (WITHOUT QUOTES) ARE THE OPTIONS. IF SET TO FALSE, ONLY EXACT MATCH WILL BE USED
    var create_all_match_type_ad_group = true;

    //NOTE - ENABLING BOTH em_only_campaign AND create_all_match_type_ad_group WILL WORK, THOUGH THERE WON'T BE AN EXACT MATCH KEYWORD WITHIN THE "ALL MATCH TYPE" AD GROUP

    //HOW YOU WANT THE SKAG AD GROUPS TO BE DENOTED
    var em_skag_ad_group_suffix = ''; //EXACT MATCH ONLY SKAG (CAN BE BLANK IF DESIRED)
    var all_match_skag_ad_group_suffix = ''; //ALL MATCH TYPE SKAG (CAN BE BLANK IF DESIRED)

    /************ ADVANCED SETTINGS ************/

    //TARGET PARTICULAR CAMPAIGN(S)
    var campaign_target = '';

    //EXCLUDE PARTICULAR CAMPAIGN(S)
    var excluded_campaign_target = '';

    //INCLUDE CLOSE VARIANTS - 'true' or 'false' (WITHOUT QUOTES) ARE THE OPTIONS
    var include_close_variant = true;

    //QUERIES YOU WANT/DON'T WANT TO CREATE SKAGS FOR 
    var in_queries = []; //WRITE YOUR INCLUDED QUERIES AS FOLLOWS - ['keyword1', 'keyword2', 'keyword3'], OR LEAVE AS [] - YOUR INCLUDED QUERIES *ALL* HAVE TO BE PRESENT IN EACH SEARCH QUERY YOU WANT TO TARGET
    var ex_queries = []; //WRITE YOUR EXCLUDED QUERIES AS FOLLOWS - ['keyword1', 'keyword2', 'keyword3'], OR LEAVE AS [] - IF A SEARCH QUERY MATCHES *ANY* OF YOUR EXCLUDED QUERIES, IT WILL BE EXCLUDED 

    //BID INCREASE/DECREASE FOR EACH MATCH TYPE - '1.25' WOULD BE A 25% INCREASE, FOR EXAMPLE 
    var em_bid_multiplier = 1.25;
    var pm_bid_multiplier = 1;

    //INCLUDE QUERIES LONGER THAN 30 CHARACTERS (WHICH WON'T FIT IN HEADLINE 1) - 'true' or 'false' (WITHOUT QUOTES) ARE THE OPTIONS
    var include_long_queries = false;

    //ADD THE SEARCH QUERY TO THE FIRST HEADLINE (PROVIDED IT'S 30 CHARACTERS OR UNDER) 
    var add_query_to_headline = true;

    /************ NO NEED TO CHANGE ANYTHING BELOW THIS LINE ************/

    var ad_group_array = [];
    var query_array = [];
    var query_cpa_target = query_cpa === '' ? '' : " AND CostPerConversion < " + query_cpa + "000000" + "";
    var close_variant = include_close_variant === true ? "['BROAD','EXACT','PHRASE','NEAR_EXACT','NEAR_PHRASE']" : "['BROAD','EXACT','PHRASE']";
    var query_length = include_long_queries === true ? 128 : 31;
    var query_conversions_adjusted = Number(query_conversions) - 1;
    var campaign_targets = campaign_target === '' ? '' : " AND CampaignName CONTAINS '" + campaign_target + "'";
    var excluded_campaign_targets = excluded_campaign_target === '' ? '' : " AND CampaignName DOES_NOT_CONTAIN '" + excluded_campaign_target + "'";

    function filtered_queries(queries) {
        var queries_type = queries === in_queries ? "AND Query CONTAINS '" : "AND Query DOES_NOT_CONTAIN '";
        var queries_array = [];
        if (queries.length > 0) {
            for (var i = 0; queries.length > i; i++) {
                queries_array.unshift(queries_type + queries[i] + "'");
            }
            return queries_array.join(" ");
        }
        return '';
    }

    var matched_queries = AdsApp.report(
        "SELECT CampaignName, AdGroupName, Query, KeywordTextMatchingQuery, ConversionValue, CostPerConversion, KeywordId, Conversions, AdGroupStatus, CampaignStatus, Impressions, AdGroupId, CampaignId, QueryMatchTypeWithVariant, AverageCpc, Cost, QueryTargetingStatus, AdFormat" +
        " FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
        " WHERE " +
        " Conversions > " + query_conversions_adjusted + "" +
        query_cpa_target +
        " AND AdGroupStatus = 'ENABLED' " +
        " AND CampaignStatus = 'ENABLED' " +
        filtered_queries(ex_queries) +
        " AND Impressions >= " + query_impressions + "" +
        " AND QueryMatchTypeWithVariant IN " + close_variant + " " +
        filtered_queries(in_queries) +
        " AND KeywordTextMatchingQuery DOES_NOT_CONTAIN '=' " +
        " AND KeywordTextMatchingQuery DOES_NOT_CONTAIN '*' " +
        " AND KeywordTextMatchingQuery DOES_NOT_CONTAIN '_' " +
        campaign_targets +
        " AND QueryTargetingStatus = 'NONE'" +
        excluded_campaign_targets +
        " DURING " + date_range + "");

    var matched_ad_groups = AdsApp.report(
        "SELECT AdGroupStatus, AdGroupName, BiddingStrategyName, BiddingStrategyType, CampaignName, CampaignStatus, AdGroupType" +
        " FROM ADGROUP_PERFORMANCE_REPORT " +
        " WHERE " +
        " AdGroupStatus = 'ENABLED' " +
        " AND CampaignStatus = 'ENABLED' " +
        " AND AdGroupType = 'SEARCH_STANDARD' " +
        " DURING " + date_range + "");

    var adGroupIterator = matched_ad_groups.rows();
    while (adGroupIterator.hasNext()) {
        var adGroup = adGroupIterator.next();
        ad_group_array.push(adGroup.AdGroupName.toLowerCase());
    }

    matched_queries = matched_queries.rows();
    while (matched_queries.hasNext()) {
        var query = matched_queries.next();

        if (query.Query.length < query_length &&
            ad_group_array.indexOf(query.Query.toLowerCase() + em_skag_ad_group_suffix.toLowerCase()) === -1 &&
            ad_group_array.indexOf(query.Query.toLowerCase() + all_match_skag_ad_group_suffix.toLowerCase()) === -1 &&
            ad_group_array.indexOf(query.Query.toLowerCase()) === -1 &&
            ad_group_array.indexOf(query.AdGroupName.toLowerCase()) != -1 &&
            query_array.indexOf(query.Query.toLowerCase()) === -1 &&
            (Number(query.ConversionValue) / Number(query.Cost) >= Number(query_roas) || query_roas === '')
        )

        {
            query_array.unshift(query.Query);
            var filtered_query = query;

            Logger.log("Query: '" + query.Query + "'  -  " + "Keyword: '" + query.KeywordTextMatchingQuery + "'  -  " + "Ad Group: '" + query.AdGroupName + "'  -  " + "Campaign: '" + query.CampaignName + "'  -  " + "Match type: '" + query.QueryMatchTypeWithVariant + "'" + "  -  " + "Impressions: " + query.Impressions + "  -  " + "Conversions: " + query.Conversions + "  -  " + "CPA: " + query.CostPerConversion + "  -  " + "ROAS: " + Number(query.ConversionValue) / Number(query.Cost) + "  -  " + "Cost: " + query.Cost);

            function neg_creator(caller) {
                var target_type = caller === 'campaign' ? AdsApp.campaigns().withIds(new Array(filtered_query.CampaignId)).get() : AdsApp.adGroups().withIds(new Array(filtered_query.AdGroupId)).get();
                var entity_to_neg = target_type;
                if (entity_to_neg.hasNext()) {
                    var negged_entity = entity_to_neg.next();
                    negged_entity.createNegativeKeyword("[" + filtered_query.Query + "]");
                }
            }

            String.prototype.toProperCase = function() {
                return this.replace(/\w\S*/g, function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            };

            function text_ad_builder(new_ad_group) {
                var pre_skag_adgroup_iterator = AdsApp.adGroups().withIds(new Array(filtered_query.AdGroupId)).get();
                if (pre_skag_adgroup_iterator.hasNext()) {
                    var pre_skag_adgroup = pre_skag_adgroup_iterator.next();
                    var adIterator = pre_skag_adgroup.ads().withCondition('Type IN [EXPANDED_TEXT_AD, RESPONSIVE_SEARCH_AD]').withCondition("Status = ENABLED").get();
                    var ad_number = adIterator.totalNumEntities();
                    while (adIterator.hasNext()) {

                        var ad = adIterator.next();

                        if (ad.isType().expandedTextAd()) {
                            var getExpandedTextAd = {
                                headline_one: ad.getHeadlinePart1(),
                                headline_two: ad.getHeadlinePart2(),
                                headline_three: ad.getHeadlinePart3(),
                                description_one: ad.getDescription1(),
                                description_two: ad.getDescription2(),
                                path_one: ad.getPath1(),
                                path_two: ad.getPath2(),
                                final_url: ad.urls().getFinalUrl()
                            };

                            var expanded_keyword_headline = add_query_to_headline === true ? filtered_query.Query.toProperCase() : getExpandedTextAd.headline_one;

                            var createdSearchAd = new_ad_group.newAd().expandedTextAdBuilder()
                                .withHeadlinePart1(filtered_query.Query.length <= 30 ? expanded_keyword_headline : getExpandedTextAd.headline_one)
                                .withHeadlinePart2(getExpandedTextAd.headline_two !== null ? getExpandedTextAd.headline_two : '')
                                .withHeadlinePart3(getExpandedTextAd.headline_three !== null ? getExpandedTextAd.headline_three : '')
                                .withDescription1(getExpandedTextAd.description_one !== null ? getExpandedTextAd.description_one : '')
                                .withDescription2(getExpandedTextAd.description_two !== null ? getExpandedTextAd.description_two : '')
                                .withPath1(getExpandedTextAd.path_one !== null ? getExpandedTextAd.path_one : '')
                                .withPath2(getExpandedTextAd.path_two !== null ? getExpandedTextAd.path_two : '')
                                .withFinalUrl(getExpandedTextAd.final_url !== null ? getExpandedTextAd.final_url : '')
                                .build();
                        } else if (ad.isType().responsiveSearchAd()) {

                            var getResponsiveTextAd = {
                                headlines: ad.getHeadlines(),
                                descriptions: ad.getDescriptions(),
                                path_one: ad.getPath1(),
                                path_two: ad.getPath2(),
                                final_url: ad.urls().getFinalUrl()
                            };

                            var responsive_keyword_headline = add_query_to_headline === true ? filtered_query.Query.toProperCase() : getResponsiveTextAd.headlines[0].text;

                            var createdResponsiveAd = new_ad_group.newAd().responsiveSearchAdBuilder()
                                .addHeadline(filtered_query.Query.length <= 30 ? responsive_keyword_headline : getResponsiveTextAd.headlines[0].text)
                                .withPath1(getResponsiveTextAd.path_one !== null ? getResponsiveTextAd.path_one : '')
                                .withPath2(getResponsiveTextAd.path_two !== null ? getResponsiveTextAd.path_two : '')
                                .withFinalUrl(getResponsiveTextAd.final_url);

                            var responsive_headline_number = getResponsiveTextAd.headlines.length === 15 ? 14 : getResponsiveTextAd.headlines.length;

                            for (var i = 1; i < responsive_headline_number; i++) {
                                createdResponsiveAd.addHeadline(getResponsiveTextAd.headlines[i].text);
                            }

                            for (var v = 0; v < getResponsiveTextAd.descriptions.length; v++) {
                                createdResponsiveAd.addDescription(getResponsiveTextAd.descriptions[v].text);
                            }

                            createdResponsiveAd.build();
                        }

                        if (ad_number == 1 && ad.isType().expandedTextAd()) {

                            var createdResponsiveAdFromExpanded = new_ad_group.newAd().responsiveSearchAdBuilder()
                                .addHeadline(filtered_query.Query.length <= 30 ? expanded_keyword_headline : getExpandedTextAd.headline_one)
                                .addHeadline(getExpandedTextAd.headline_two !== null ? getExpandedTextAd.headline_two : '')
                                .addHeadline(getExpandedTextAd.headline_three !== null ? getExpandedTextAd.headline_three : '')
                                .addDescription(getExpandedTextAd.description_one !== null ? getExpandedTextAd.description_one : '')
                                .addDescription(getExpandedTextAd.description_two !== null ? getExpandedTextAd.description_two : '')
                                .withPath1(getExpandedTextAd.path_one !== null ? getExpandedTextAd.path_one : '')
                                .withPath2(getExpandedTextAd.path_two !== null ? getExpandedTextAd.path_two : '')
                                .withFinalUrl(getExpandedTextAd.final_url);
                            createdResponsiveAdFromExpanded.build();
                        }
                    }
                }
            }

            function em_campaign_ad_group_creator() {
                var campaignIterator = AdsApp.campaigns().withCondition("Name = '" + filtered_query.CampaignName + em_only_campaign_suffix + "'").get();
                while (campaignIterator.hasNext()) {
                    var campaign = campaignIterator.next();
                    var ad_group_builder = campaign.newAdGroupBuilder();
                    var ad_group_operation = ad_group_builder
                        .withName(filtered_query.Query.toProperCase() + em_skag_ad_group_suffix)
                        .withStatus("ENABLED")
                        .build();
                    var new_ad_group = ad_group_operation.getResult();
                    try {
                        new_ad_group.newKeywordBuilder().withText("[" + filtered_query.Query + "]").withCpc(Number(filtered_query.AverageCpc) * em_bid_multiplier).build();
                    } catch (error) {
                        new_ad_group.newKeywordBuilder().withText("[" + filtered_query.Query + "]").build();
                    }
                }
                var text_ad_caller = campaignIterator.totalNumEntities() >= 1 ? text_ad_builder(new_ad_group) : Logger.log("No '" + filtered_query.CampaignName + em_only_campaign_suffix + "' campaign for the '" + filtered_query.Query + "' query - either create a campaign with that name, or change the 'em_only_campaign' setting to false");
                var campaign_level_neg = campaignIterator.totalNumEntities() >= 1 ? neg_creator('campaign') : '';
            }

            function ad_group_creator(suffix_type) {
                var campaignIterator = AdsApp.campaigns().withIds(new Array(filtered_query.CampaignId)).get();
                while (campaignIterator.hasNext()) {
                    var campaign = campaignIterator.next();
                    var ad_group_builder = campaign.newAdGroupBuilder();
                    var ad_group_operation = ad_group_builder
                        .withName(filtered_query.Query.toProperCase() + suffix_type)
                        .withStatus("ENABLED")
                        .build();
                    var new_ad_group = ad_group_operation.getResult();
                    try {
                        var exact_match_keyword = em_only_campaign === true ? '' : new_ad_group.newKeywordBuilder().withText("[" + filtered_query.Query + "]").withCpc(Number(filtered_query.AverageCpc) * em_bid_multiplier).build();
                        var phrase_match_keyword = create_all_match_type_ad_group === true ? new_ad_group.newKeywordBuilder().withText('"' + filtered_query.Query + '"').withCpc(Number(filtered_query.AverageCpc) * pm_bid_multiplier).build() : '';
                    } catch (error) {
                        var exact_match_keyword_no_bid = em_only_campaign === true ? '' : new_ad_group.newKeywordBuilder().withText("[" + filtered_query.Query + "]").build();
                        var phrase_match_keyword_no_bid = create_all_match_type_ad_group === true ? new_ad_group.newKeywordBuilder().withText('"' + filtered_query.Query + '"').build() : '';
                    }
                }
                text_ad_builder(new_ad_group);
                var ad_group_level_neg = em_only_campaign === true ? '' : neg_creator('ad_group');
            }
            var em_campaign_creation = em_only_campaign === true ? em_campaign_ad_group_creator() : '';
            var all_match_type_creation = create_all_match_type_ad_group === true ? ad_group_creator(all_match_skag_ad_group_suffix) : '';
            var single_match_type_creation = em_only_campaign === false ? (create_all_match_type_ad_group === false ? ad_group_creator(em_skag_ad_group_suffix) : '') : '';
        }
    }
}
