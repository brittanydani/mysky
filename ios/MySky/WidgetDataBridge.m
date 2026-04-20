#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataBridge, NSObject)

RCT_EXTERN_METHOD(updateWidgetData:(NSDictionary *)data)
RCT_EXTERN_METHOD(consumePendingCheckIns:(RCTResponseSenderBlock)callback)

@end
